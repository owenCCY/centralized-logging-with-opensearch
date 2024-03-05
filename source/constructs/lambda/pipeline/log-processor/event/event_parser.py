# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from abc import ABC, abstractmethod
import base64
import logging
import json
import gzip
import os
import urllib
import urllib.parse
import importlib
import boto3
from itertools import islice
import threading
from typing import Iterable
from datetime import datetime, timedelta
from commonlib import AWSConnection
from log_processor.log_parser import LogParser
from idx.idx_svc import AosIdxService
from event.failed_records_handler import Restorer

logger = logging.getLogger()
logger.setLevel(logging.INFO)


TOTAL_RETRIES = 3
SLEEP_INTERVAL = 10
DEFAULT_BULK_BATCH_SIZE = "10000"
BULK_ACTION = "index"

# batch size can be overwritten via Env. var.
batch_size = int(os.environ.get("BULK_BATCH_SIZE", DEFAULT_BULK_BATCH_SIZE))
bucket_name = os.environ.get("LOG_BUCKET_NAME")

default_region = os.environ.get("AWS_REGION")
log_type = os.environ.get("LOG_TYPE")


CONFIG_JSON = os.environ.get("CONFIG_JSON", "")
stack_name = os.environ.get("STACK_NAME", "")
IS_APP_PIPELINE = "apppipe" in stack_name.lower()
IS_SVC_PIPELINE = not IS_APP_PIPELINE


plugins = os.environ.get("PLUGINS", "")
if plugins:
    plugin_modules = [
        importlib.import_module(plugin).Plugin(log_type)
        for plugin in plugins.split(",")
    ]
else:
    plugin_modules = []


#
# Define index name
# Default to <index-prefix>-<type>-YYYY-MM-DD
# index_name = aos_idx_svc.default_index_name()
# logger.info("index name: %s", index_name)

ERROR_UNABLE_TO_PARSE_LOG_RECORDS = "Unable to parse log records: %s"
assume_role = os.environ.get("LOG_SOURCE_ACCOUNT_ASSUME_ROLE", "")

conn = AWSConnection()
if log_type in ("Lambda", "RDS") or IS_APP_PIPELINE:
    s3_resource = conn.get_client("s3", client_type="resource")
else:
    s3_resource = conn.get_client(
        "s3", sts_role_arn=assume_role, client_type="resource"
    )

log_source_region = os.environ.get("LOG_SOURCE_REGION", default_region)

# for WAF sampled
interval = int(os.environ.get("INTERVAL", "1"))
web_acl_names = os.environ.get("WEB_ACL_NAMES", "")
web_acl_list = web_acl_names.split(",")
scope = os.environ.get("SCOPE", "REGIONAL")
waf_region = log_source_region if scope == "REGIONAL" else "us-east-1"
waf_client = conn.get_client("wafv2", sts_role_arn=assume_role, region_name=waf_region)

source = str(os.environ.get("SOURCE", "KDS"))
idx_svc = AosIdxService()
restorer = Restorer()
lambda_client = boto3.client("lambda", region_name=default_region)

sub_category = str(os.environ.get("SUB_CATEGORY", ""))


class EventType(ABC):
    _log_buffer = ""

    def __init__(
        self,
        log_buffer="",
    ) -> None:
        super().__init__()

        self._parser_name = log_type
        if sub_category:
            self._parser_name = self._parser_name + "With" + sub_category

        if log_buffer:
            self._log_buffer = log_buffer
            self._log_parser: LogParser = LogParser(self._parser_name)

    @abstractmethod
    def process_event(self, event):
        """Parse the lambda events, and return processed json record(s).

        This should be implemented in each service class.
        """
        pass

    @property
    def log_parser(self):
        return self._log_parser

    def _bulk(self, records):
        if len(records) == 0:
            return [], []
        if self._log_buffer:
            return idx_svc.bulk_load_idx_records(self._process_by_plugins(records))
        else:
            return idx_svc.bulk_load_idx_records(records, True)

    def _process_by_plugins(self, records):
        if plugin_modules and len(records) > 0:
            for p in plugin_modules:
                records = p.process(records)
        return records

    def _logging(self, total, failed_number):
        # only s3 source
        if log_type == "WAFSampled":
            logger.info(
                "---> StackName: %s Total: %d Loaded: %d Failed: %d Scope: %s",
                stack_name,
                total,
                total - failed_number,
                failed_number,
                scope,
            )
        else:
            logging.info(
                "--> StackName: %s Total: %d Excluded: 0 Loaded: %d Failed: %d",
                stack_name,
                total,
                total - failed_number,
                failed_number,
            )


class KDS(EventType):
    def __init__(self, log_source) -> None:
        super().__init__(log_source)

    def process_event(self, event):
        # only handle
        records = []
        if self._log_buffer == "KDS" and "Records" in event:
            if log_type in ["CloudTrail", "VPCFlow"]:
                return self._process_event_with_gzip(event)

            for record in event["Records"]:
                # single record with FLB
                record_str = base64.b64decode(record["kinesis"]["data"]).decode(
                    "utf-8", errors="replace"
                )
                try:
                    if IS_SVC_PIPELINE:
                        # cloudfront with RT
                        value = self._log_parser.parse(record_str)
                    else:
                        value = self._log_parser.parse_single_line(record_str)
                except Exception:
                    logger.info(f"this log is not imported: {record_str}")
                    continue
                records.append(value)

        total, failed_records = self._bulk(records)
        restorer.export_failed_records(
            plugin_modules,
            failed_records,
            restorer._get_export_prefix(),
        )
        self._logging(len(total), len(failed_records))

    def _process_event_with_gzip(self, event):
        records = []
        if self._log_buffer == "KDS" and self._parser_name in [
            "CloudTrailWithCWL",
            "VPCFlowWithCWL",
        ]:
            for record in event["Records"]:
                # multiple records with CloudTrailWithCWL and VPCFlowWithCWL
                values = self._log_parser.parse(
                    gzip.decompress(base64.b64decode(record["kinesis"]["data"])).decode(
                        "utf-8", errors="replace"
                    )
                )
                for value in values:
                    records.append(value)

        total, failed_records = self._bulk(records)
        restorer.export_failed_records(
            plugin_modules,
            failed_records,
            restorer._get_export_prefix(),
        )
        self._logging(len(total), len(failed_records))


class MSK(EventType):
    def __init__(self, log_source) -> None:
        super().__init__(log_source)

    def process_event(self, event):
        records = []

        if (
            self._log_buffer != "MSK"
            or "eventSource" not in event
            or event["eventSource"] != "aws:kafka"
        ):
            return records

        for k, v in event["records"].items():
            # logger.info("Key is %s", k)
            if not isinstance(v, list):
                logger.error("The messages must be a list")
                return []

            # logger.info("Message size is %d", len(v))
            for msg in v:
                value = json.loads(
                    base64.b64decode(msg.get("value", "")).decode(
                        "utf-8", errors="replace"
                    )
                )
                # logger.info(value)
                records.append(value)

        total, failed_records = self._bulk(records)
        restorer.export_failed_records(
            plugin_modules,
            failed_records,
            restorer._get_export_prefix(),
        )
        self._logging(len(total), len(failed_records))


class WAFSampled(EventType):
    def process_event(self, event):
        records = []
        web_acls_resp = waf_client.list_web_acls(Scope=scope, Limit=100)
        now = self.get_event_time(event)
        for acl in web_acls_resp["WebACLs"]:
            if acl["Name"] not in web_acl_list:
                continue
            records.extend(self.get_records_for_acl(acl, now))

        total, failed_records = self._bulk(records)
        restorer.export_failed_records(
            plugin_modules,
            failed_records,
            restorer._get_export_prefix(),
        )
        self._logging(len(total), len(failed_records))

    def get_event_time(self, event):
        if dt := event.get("time", ""):
            return datetime.strptime(dt, "%Y-%m-%dT%H:%M:%SZ")
        else:
            logger.info("Unknown event time, use current datetime")
            return datetime.now()

    def get_records_for_acl(self, acl, now):
        response = waf_client.get_web_acl(
            Name=acl["Name"],
            Scope=scope,
            Id=acl["Id"],
        )

        rules = [response["WebACL"]]
        rules.extend(response["WebACL"]["Rules"])
        if len(rules) == 0:
            logger.info("No metrics found for %s", acl["Name"])
            return []

        records = []
        for rule in rules:
            cfg = rule["VisibilityConfig"]
            if cfg["SampledRequestsEnabled"]:
                metric_name = cfg["MetricName"]

                # Delay for 5 minute + interval
                response = waf_client.get_sampled_requests(
                    WebAclArn=acl["ARN"],
                    RuleMetricName=metric_name,
                    Scope=scope,
                    TimeWindow={
                        "StartTime": now - timedelta(minutes=5 + interval),
                        "EndTime": now - timedelta(minutes=5),
                    },
                    MaxItems=500,
                )

                for req in response["SampledRequests"]:
                    req["WebaclName"] = acl["Name"]
                    records.append(req)
        return records


class Counter:
    def __init__(self):
        self._value = 0
        self._lock = threading.Lock()

    @property
    def value(self):
        return self._value

    def set_value(self, value):
        with self._lock:
            self._value = value

    def increment(self):
        with self._lock:
            self._value += 1

    def decrement(self):
        with self._lock:
            self._value -= 1


class SQS(EventType):
    def __init__(self, log_source) -> None:
        self._config = dict()
        if CONFIG_JSON:
            # from s3 source
            self._config = json.loads(CONFIG_JSON)
            global sub_category
            sub_category = "S3"

        self._is_gzip = self._config.get("is_gzip", False)
        self._time_key = self._config.get("time_key", "")
        self._time_format = self._config.get("time_format", "")
        self._time_offset = self._config.get("time_offset", "")
        super().__init__(log_source)

    def s3_read_object_by_lines(self, bucket, object_key):
        """Read a file from S3 Line by Line"""
        obj = s3_resource.Object(bucket, object_key)
        try:
            logger.info("Start reading file...")
            body = obj.get()["Body"]
            if (
                self._is_gzip
                or object_key.endswith(".gz")
                or log_type in ["RDS", "Lambda"]
            ):
                with gzip.GzipFile(fileobj=body) as f:
                    while line := f.readline():
                        yield line.decode("utf-8", errors="replace")

            else:
                for line in body.iter_lines(keepends=True):
                    yield line.decode("utf-8", errors="replace")

        except Exception as e:
            # unable to get
            logger.error(e)
            raise RuntimeError(f"Unable to process log file {object_key}")

    def get_bucket_and_keys(self, sqs_event):
        """Get log file path from event message"""
        try:
            events = []
            if "body" in sqs_event["Records"][0]:
                # this is a SQS event messages
                # extract the message body to get S3 events.
                for event_record in sqs_event["Records"]:
                    sqs_event = json.loads(event_record["body"])
                    # skip test event
                    if "Event" in sqs_event and sqs_event["Event"] == "s3:TestEvent":
                        logger.info("Test Message, do nothing...")
                        continue
                    events.append(sqs_event["Records"][0])
            else:
                events = sqs_event["Records"]
            for event_record in events:
                if "s3" in event_record:
                    # s3 event message
                    bucket = event_record["s3"]["bucket"]["name"]
                    key = urllib.parse.unquote_plus(
                        event_record["s3"]["object"]["key"], encoding="utf-8"
                    )

                    yield (bucket, key)
        except Exception as e:
            logger.error(e)
            raise RuntimeError(f"Unknown Event {sqs_event}")

    def _counter_iter(self, iterable: Iterable, counter: Counter):
        for each in iterable:
            counter.increment()
            yield each

    def _batch_iter(self, iterable, batch_size=10):
        iterator = iter(iterable)
        while b := list(islice(iterator, batch_size)):
            yield b

    def process_event(self, event):
        """
        config = {
            "parser": "regex",
            "regex": "(?P<remote_addr>\S+)\s+-\s+(?P<remote_user>\S+)\s+\[(?P<time_local>\d+/\S+/\d+:\d+:\d+:\d+\s+\S+)\]\s+\"(?P<request_method>\S+)\s+(?P<request_uri>\S+)\s+\S+\"\s+(?P<status>\S+)\s+(?P<body_bytes_sent>\S+)",
            "time_key": "time_local",
            "time_format": "%d/%b/%Y:%H:%M:%S %z",
            "time_offset": "",
            "is_gzip": False,
        }
        """
        if (
            "Records" in event
            and "eventSource" in event["Records"][0]
            and event["Records"][0]["eventSource"] == "aws:sqs"
        ):
            failed_records_count = 0
            total_logs_counter = Counter()
            for bucket, key in self.get_bucket_and_keys(event):
                lines = self.s3_read_object_by_lines(bucket, key)
                if CONFIG_JSON:
                    log_entry_iter = self.get_log_entry_iter(lines)
                    # log format is LogEntry type
                    logs = self._counter_iter(
                        (log.dict(self._time_key) for log in log_entry_iter),
                        total_logs_counter,
                    )

                else:
                    # service log and application log with s3 data buffer
                    log_iter = self._log_parser.parse(lines)

                    logs = self._counter_iter(log_iter, total_logs_counter)

                batches = self._batch_iter(logs, batch_size)
                for idx, records in enumerate(batches):
                    total, failed_records = self._bulk(records)
                    failed_records_count += len(failed_records)
                    restorer.export_failed_records(
                        plugin_modules,
                        failed_records,
                        restorer._get_export_prefix(idx, bucket, key),
                    )
                self._logging(total_logs_counter.value, failed_records_count)

    def get_log_entry_iter(self, lines):
        if self._parser_name != "JSONWithS3":
            # regex log from s3 source
            return self._log_parser.parse_for_s3_event(
                lines,
                self._config["regex"].replace("?<", "?P<"),
                self._time_key,
                self._time_format,
                self._time_offset,
            )
        else:
            # json log from s3 source, not s3 buffer
            self._log_parser.set_time(
                self._time_key,
                self._time_format,
                self._time_offset,
            )
            return self._log_parser.parse(lines)

    def get_log_iter(self, lines):
        if IS_SVC_PIPELINE:
            # service log with s3 bucket
            return self._log_parser.parse(lines)
        else:
            # application log with s3 data buffer, JSON format log from FLB
            return self._log_parser.parse_iterable(lines)


class LogProcessor:
    def __init__(self) -> None:
        idx_svc.init_idx_env()

    def process_log(self, event) -> list:
        func_name = "parse_" + source.lower() + "_event"
        total, failed_records = getattr(self, func_name)(event)
