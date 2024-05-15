# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import re
import json
import copy
import datetime
from typing import Union
from utils.helpers import logger, ValidateParameters, iso8601_strftime
from utils.aws import AthenaClient, SFNClient
from utils.models.etllog import ETLLogTable
from utils.models.meta import MetaTable


AWS_DDB_META = MetaTable()
AWS_DDB_ETL_LOG = ETLLogTable()
AWS_ATHENA = AthenaClient()
AWS_SFN = SFNClient()


class Parameters(ValidateParameters):
    """This class is used to parse ,validate and store all incoming parameters.
       
       !!!Case sensitive!!! 
       
       :param parameters (dict): e.g.  {
                                        "API": "Athena: StartQueryExecution",
                                        "executionName": "848be54a-ae2c-414c-9ae3-f0b3d11089ab",
                                        "taskId": "e1c01f00-6f25-4c0a-8089-06b9d6ef1c81",
                                        "queryString": "SELECT * FROM TABLE LIMIT 10;",
                                        "workGroup": "Primary",
                                        "outputLocation": "s3://stagingbucket/athena-results",
                                        "extra": {
                                                "parentTaskId": "00000000-0000-0000-0000-000000000000",
                                                "stateName": "Step 2.1: Create tmp table in Athena",
                                                "stateMachineName": "LogProcessor-HBTz7GoOjZoz",
                                                "pipelineId": "189f73eb-1808-47e4-a9db-ee9c35100abe"
                                                },
                                        "taskToken": "AQCEAAAAKgAAAAMAAAAA"
                                        }
    """
    api_start_query_execution = 'Athena: StartQueryExecution'
    api_get_query_execution = 'Athena: GetQueryExecution'
    api_input_formatter = 'Step Functions: ExecutionInputFormatter'
    api_dynamodb_put_item = 'DynamoDB: PutItem'
        
    def _required_parameter_check(self, parameters) -> None:
        """Required parameter verification, when the parameter does not exist, an exception message will be returned."""
        self._child_parameter_lookup_check(parameters, keys=('API', 'executionName', 'taskId', ))
        self.execution_name = parameters['executionName']
        self.task_id = parameters['taskId']
        
        self.api = parameters['API']
        if self.api not in (self.api_get_query_execution, self.api_start_query_execution, self.api_input_formatter, self.api_dynamodb_put_item):
            raise ValueError(f'Invalid API parameter, optional value: {self.api_start_query_execution}, {self.api_get_query_execution}, {self.api_input_formatter}, {self.api_dynamodb_put_item}.')

        if self.api == self.api_start_query_execution:
            for required_param in ('queryString', 'workGroup', 'outputLocation'):
                if not parameters.get(required_param):
                    raise ValueError(f'API: "{self.api_start_query_execution}", missing required parameter: {required_param}')
            self.query_string = parameters['queryString']
            self.work_group = parameters['workGroup']
            self.output_location = parameters['outputLocation']
        elif self.api == self.api_input_formatter:
            self._execution_input_formatter_parameter_check(parameters=parameters)
            self.input = parameters['input']
    
    def _execution_input_formatter_parameter_check(self, parameters) -> None:
        for required_param in ('input',):
            if not parameters.get(required_param):
                raise ValueError(f'API: "{self.api_input_formatter}", missing required parameter: {required_param}')
        
        self._child_parameter_lookup_check(parameters['input']['metadata'], keys=('s3', 'athena'), path='input.metadata')
        self._child_parameter_lookup_check(parameters['input']['metadata']['s3'], keys=('archivePath',), path='input.metadata.s3')
        self._child_parameter_lookup_check(parameters['input']['metadata']['athena'], keys=('statements',), path='input.metadata.athena')
        self._child_parameter_lookup_check(parameters['input']['metadata']['athena']['statements'], keys=('create', 'insert', 'drop', ), path='input.metadata.athena.statements')
        
    def _optional_parameter_check(self, parameters) -> None:
        """Optional parameter verification, when the parameter does not exist or is illegal, supplement the default value."""
        self.extra: dict = self._get_parameter_value(parameters.get('extra', {}), dict, {}) # type: ignore
        self.function_name = self.extra.get('functionName', '') # type: ignore
        self.parent_task_id = self.extra.get('parentTaskId', '') # type: ignore
        self.state_name = self.extra.get('stateName', '') # type: ignore
        self.state_machine_name = self.extra.get('stateMachineName', '') # type: ignore
        self.pipeline_id = self.extra.get('pipelineId', '') # type: ignore
        self.task_token = parameters.get('taskToken', '')
        self.ddb_item = self.get_ddb_item()
        
    def get_ddb_item(self):
        ddb_item = {'executionName': self.execution_name, 'taskId': self.task_id, 'API': self.api, 'functionName': self.function_name, 
                    'data': '', 'startTime': '', 'endTime': '', 'status': '', 'expirationTime': int(datetime.datetime.now(datetime.UTC).timestamp() + AWS_DDB_META.etl_log_ttl_secs)}
        ddb_item.update(self.extra)
        ddb_item['pipelineIndexKey'] = ':'.join((ddb_item.get('pipelineId', ''), ddb_item.get('stateMachineName', ''), ddb_item['taskId']))
        return ddb_item


def lambda_handler(event, context) -> None:
    logger.info(f'Received request: {json.dumps(event)}')
    if not isinstance(event, dict):
        raise ValueError('The event is not a dict.')

    param = Parameters(event)
    param.function_name = context.function_name
    param.ddb_item['functionName'] = param.function_name
    logger.info(f'The parameters: API: {param.api}, execution_name: {param.execution_name}, taskId: {param.task_id}, '
                    f'function_name: {param.function_name}, parentTaskId: {param.parent_task_id}, '
                    f'stateMachineName: {param.state_machine_name}, stateName: {param.state_name}, pipelineId: {param.pipeline_id}, '
                    f'extra: {param.extra}, taskToken: {param.task_token}.')
    
    item, output = copy.deepcopy(param.ddb_item), ''
    
    start_time = iso8601_strftime()

    if param.api == 'Athena: StartQueryExecution':
        logger.info(f'The API is "Athena: StartQueryExecution", required parameter queryString: {param.query_string}, workGroup: {param.work_group}, '
                    f'outputLocation: {param.output_location}.')
        response = AWS_ATHENA.start_query_execution(query_string=param.query_string, work_group=param.work_group,
                                                    output_location=param.output_location, asynchronous=False,
                                                    interval = 3)
        logger.info(f"The QueryString: {param.query_string}, response is {response}.")
        if not response['QueryExecution']['QueryExecutionId']:
            item['data'] = param.query_string
            item['startTime'] = start_time
            item['endTime'] = iso8601_strftime()
            item['status'] = 'Failed'
        else:
            query_execution_id = response['QueryExecution']['QueryExecutionId']
            item['taskId'] = query_execution_id
            item = get_item_from_execution_id(query_execution_id=query_execution_id, item=item)
    elif param.api == 'Athena: GetQueryExecution':
        item = get_item_from_execution_id(query_execution_id=param.task_id, item=item)
    elif param.api == 'Step Functions: ExecutionInputFormatter':
        item['startTime'] = start_time
        output = json.dumps(execution_input_formatter(input=param.input, execution_name=param.execution_name))
        item['endTime'] = iso8601_strftime()
        item['data'] = output
        item['status'] = 'Succeeded'
    
    write_logs_to_ddb(execution_name=param.execution_name, task_id=param.task_id, item=item, task_token=param.task_token, output=output)
    

def get_item_from_execution_id(query_execution_id: str, item : dict) -> dict:
    """Call the get_query_execution to obtain the execution result, update item written to DDB and return. 

    :param query_execution_id (str): The unique ID of the query execution.
    :param: item (dict): Item written to DDB.
    :return: new item
    """
    query_execution_response = AWS_ATHENA.get_query_execution(query_execution_id)
    if query_execution_response['QueryExecution']['QueryExecutionId']:
        query_execution_status = AWS_ATHENA.get_query_execution_status(query_execution_response)
    
        item['data'] = query_execution_status['query']
        item['startTime'] = query_execution_status['submissionDateTime']
        item['endTime'] = query_execution_status['completionDateTime']
        item['status'] = query_execution_status['state'].title()
    else:
        item['startTime'] = iso8601_strftime()
        item['endTime'] = iso8601_strftime()
        item['status'] = 'Failed'
    return item
    

def write_logs_to_ddb(execution_name: str, task_id: str, item: dict, task_token: Union[str, None] = None, output: str = '') -> None:
    """Write log data to Dynamodb, If task_token is not None, callback to step function. When task_token has a value
       and item['status'] is SUCCEEDED and COMPLETED, callback success, otherwise the callback failure.

    :param execution_name: execution name, partition key
    :param task_id: task id,  sort key
    :param item: Item written to DDB.
    :param task_token: $$.Task.Token in the step function context
    :return:
    """
    if not output:
        output = json.dumps(item)
    item['pipelineIndexKey'] = ':'.join((item.get('pipelineId', ''), item.get('stateMachineName', ''), item['taskId']))
    logger.info(f'Put item to DynamoDB, item: {item}.')
    AWS_DDB_ETL_LOG.put(execution_name=execution_name, task_id=task_id, item=item)
    if task_token:
        sfn_callback_func = 'send_task_success' if item.get('status') == 'Succeeded' else 'send_task_failure' 
        logger.info(f"Callback {sfn_callback_func} to Amazon Step Function, output: {item}.")
        AWS_SFN.send_callback(task_token, output=output, function=sfn_callback_func)


def execution_input_formatter(input: dict, execution_name: str) -> dict:
    statements = input.get('metadata', {}).get('athena', {}).get('statements', {})
    pattern = r"\{([^}]+)\}"
    repl = r'{{\1}}'
    statements['create'] = re.sub(pattern, repl, statements['create']).format(execution_name, f'{input["metadata"]["s3"]["archivePath"]}/{execution_name}')
    statements['insert'] = re.sub(pattern, repl, statements['insert']).format(execution_name, execution_name)
    statements['drop'] = re.sub(pattern, repl, statements['drop']).format(execution_name)
    aggregate = []
    for statement in statements.get('aggregate', []):
        aggregate.append(re.sub(pattern, repl, statement).format(execution_name))
    statements['aggregate'] = aggregate
    
    return input
