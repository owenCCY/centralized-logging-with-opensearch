/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  Codec,
  DomainDetails,
  DomainStatusCheckResponse,
  EngineType,
  ErrorCode,
  IndexSuffix,
} from "API";
import { checkIndexNameValidate, defaultStr } from "assets/js/utils";
import { PartialServiceType } from "pages/pipelineAlarm/AlarmAndTags";
import Swal, { SweetAlertResult } from "sweetalert2";
import { SERVICE_LOG_INDEX_SUFFIX, WarmTransitionType, YesNo } from "types";
import i18n from "i18n";
import {
  DOMAIN_ALLOW_STATUS,
  DUPLICATE_OVERLAP_COMMON_SETTING,
} from "assets/js/const";
export type OpenSearchState = {
  domainLoading: boolean; // Status of loading domain
  domainNameError: boolean; // Error of domain name
  domainCheckedStatus: DomainStatusCheckResponse | null; // Status of domain
  shardsError: string;
  capacityError: string;
  warmLogError: string;
  coldLogError: string;
  retentionLogError: string;
  indexPrefixError: string;
  showAdvancedSetting?: boolean;

  needCreateLogging: boolean;
  warmEnable: boolean;
  coldEnable: boolean;
  esDomainId: string;
  enableRolloverByCapacity: boolean;
  warmTransitionType: string;
  rolloverSizeNotSupport: boolean;

  engineType: string;
  endpoint: string;
  domainName: string;
  opensearchArn: string;

  indexPrefix: string;
  createDashboard: string;
  vpcId: string;
  subnetIds: string;
  publicSubnetIds: string;
  securityGroupId: string;
  shardNumbers: string;
  replicaNumbers: string;
  warmAge: string;
  coldAge: string;
  retainAge: string;
  rolloverSize: string;
  indexSuffix: string;
  appIndexSuffix: string;
  codec: string;
  refreshInterval: string;
};

export interface AppLogOpenSearchParam {
  coldLogTransition: string;
  domainName: string;
  engine: string;
  indexPrefix: string;
  logRetention: string;
  opensearchArn: string;
  opensearchEndpoint: string;
  replicaNumbers: string;
  shardNumbers: string;
  rolloverSize: string;
  indexSuffix: string;
  codec: string;
  refreshInterval: string;
  vpc: {
    publicSubnetIds: string;
    privateSubnetIds: string;
    securityGroupId: string;
    vpcId: string;
  };
  warmLogTransition: string;
}

export const INIT_OPENSEARCH_DATA: OpenSearchState = {
  domainLoading: false,
  domainNameError: false,
  domainCheckedStatus: null,
  shardsError: "",
  capacityError: "",
  warmLogError: "",
  coldLogError: "",
  retentionLogError: "",
  indexPrefixError: "",
  showAdvancedSetting: false,

  needCreateLogging: false,
  engineType: "",
  warmEnable: false,
  coldEnable: false,
  endpoint: "",
  domainName: "",
  opensearchArn: "",
  esDomainId: "",
  indexPrefix: "",
  createDashboard: YesNo.Yes,
  vpcId: "",
  subnetIds: "",
  publicSubnetIds: "",
  securityGroupId: "",
  shardNumbers: "1",
  replicaNumbers: "1",
  enableRolloverByCapacity: true,
  warmTransitionType: WarmTransitionType.IMMEDIATELY,
  warmAge: "0",
  coldAge: "60",
  retainAge: "180",
  rolloverSize: "30",
  indexSuffix: SERVICE_LOG_INDEX_SUFFIX.yyyy_MM_dd,
  appIndexSuffix: IndexSuffix.yyyy_MM_dd,
  codec: Codec.best_compression,
  refreshInterval: "1s",
  rolloverSizeNotSupport: false,
};

export const AOS_EXCLUDE_PARAMS = [
  "esDomainId",
  "enableRolloverByCapacity",
  "warmTransitionType",
  "warmEnable",
  "coldEnable",
  "needCreateLogging",
  "rolloverSizeNotSupport",
  "domainLoading",
  "domainNameError",
  "domainCheckedStatus",
  "shardsError",
  "capacityError",
  "warmLogError",
  "coldLogError",
  "retentionLogError",
  "indexPrefixError",
  "showAdvancedSetting",
  // below parameters only for app log
  "opensearchArn",
  "publicSubnetIds",
  "appIndexSuffix",
];

export const rolloverAndLogLifecycleTransformData = (
  openSearch: OpenSearchState
) => {
  return {
    rolloverSize: openSearch.enableRolloverByCapacity
      ? openSearch.rolloverSize + "gb"
      : "",
    warmLogTransition: (() => {
      const userInputWarmAge = openSearch.warmAge;
      if (openSearch.warmEnable && userInputWarmAge) {
        if (openSearch.warmTransitionType === WarmTransitionType.IMMEDIATELY) {
          return "1s";
        } else if (userInputWarmAge !== "0") {
          return userInputWarmAge + "d";
        }
      }
      return "";
    })(),
    coldLogTransition: (() => {
      const userInputCodeAge = openSearch.coldAge;
      if (
        openSearch.coldEnable &&
        userInputCodeAge &&
        userInputCodeAge !== "0"
      ) {
        return userInputCodeAge + "d";
      }
      return "";
    })(),
    logRetention: (() => {
      const userInputRetainAge = openSearch.retainAge;
      if (userInputRetainAge && userInputRetainAge !== "0") {
        return userInputRetainAge + "d";
      }
      return "";
    })(),
  };
};

export const convertOpenSearchStateToAppLogOpenSearchParam = (
  state: OpenSearchState
): AppLogOpenSearchParam => {
  return {
    domainName: state.domainName,
    engine: state.engineType as EngineType,
    indexPrefix: state.indexPrefix,
    opensearchArn: state.opensearchArn,
    opensearchEndpoint: state.endpoint,
    replicaNumbers: state.replicaNumbers,
    shardNumbers: state.shardNumbers,
    indexSuffix: state.appIndexSuffix as IndexSuffix,
    codec: state.codec,
    refreshInterval: state.refreshInterval,
    vpc: {
      privateSubnetIds: state.subnetIds,
      publicSubnetIds: state.publicSubnetIds,
      securityGroupId: state.securityGroupId,
      vpcId: state.vpcId,
    },
    ...rolloverAndLogLifecycleTransformData(state),
  };
};

export const validateIndexPrefix = (state: OpenSearchState) => {
  if (state.indexPrefix.trim() === "") {
    return "applog:create.ingestSetting.indexNameError";
  }
  if (!checkIndexNameValidate(state.indexPrefix)) {
    return "applog:create.ingestSetting.indexNameFormatError";
  }
  return "";
};

export const validateShardNumbers = (state: OpenSearchState) => {
  return parseInt(state.shardNumbers) <= 0
    ? "servicelog:cluster.shardNumError"
    : "";
};

export const validateRolloverSize = (state: OpenSearchState) => {
  return state.enableRolloverByCapacity && parseFloat(state.rolloverSize) <= 0
    ? "servicelog:cluster.rolloverError"
    : "";
};

export const validateWarmAge = (state: OpenSearchState) => {
  return parseInt(state.warmAge) < 0
    ? "applog:create.specifyOS.warmLogInvalid"
    : "";
};

export const validateColdAge = (state: OpenSearchState) => {
  if (parseInt(state.coldAge) < 0) {
    return "applog:create.specifyOS.coldLogInvalid";
  }
  if (
    state.warmTransitionType === WarmTransitionType.BY_DAYS &&
    parseInt(state.coldAge) < parseInt(state.warmAge)
  ) {
    return "applog:create.specifyOS.coldLogMustThanWarm";
  }
  return "";
};

export const validateRetentionAge = (state: OpenSearchState) => {
  if (parseInt(state.retainAge) < 0) {
    return "applog:create.specifyOS.logRetentionError";
  }
  const isRetentionLessThanWarm =
    state.warmEnable && parseInt(state.retainAge) < parseInt(state.warmAge);
  const isRetentionLessThanCold =
    state.coldEnable && parseInt(state.retainAge) < parseInt(state.coldAge);
  if (
    (state.warmTransitionType === WarmTransitionType.BY_DAYS &&
      (isRetentionLessThanWarm || isRetentionLessThanCold)) ||
    isRetentionLessThanCold
  ) {
    return "applog:create.specifyOS.logRetentionMustLargeThanCodeAndWarm";
  }
  return "";
};

export const isIndexPrefixOverlap = (errorCode: string) => {
  return (
    errorCode === ErrorCode.OVERLAP_WITH_INACTIVE_INDEX_PREFIX ||
    errorCode === ErrorCode.OVERLAP_INDEX_PREFIX
  );
};

export const isIndexDuplicated = (errorCode: string) => {
  return (
    errorCode === ErrorCode.DUPLICATED_WITH_INACTIVE_INDEX_PREFIX ||
    errorCode === ErrorCode.DUPLICATED_INDEX_PREFIX
  );
};

export const handleIndexPrefixOverlapAlert = (
  errorCode: string,
  message: string,
  resultFun: (result: SweetAlertResult) => void
) => {
  Swal.fire({
    ...DUPLICATE_OVERLAP_COMMON_SETTING,
    title: defaultStr(i18n.t("warning")),
    showCancelButton: true,
    confirmButtonText: defaultStr(i18n.t("button.cancel")),
    cancelButtonText: defaultStr(i18n.t("button.edit")),
    text: i18n.t("applog:create.ingestSetting.overlapIndexError", {
      message: message,
    }),
  }).then((result) => {
    return resultFun(result);
  });
};

export const handleIndexPrefixDuplicatedAlert = (
  errorCode: string,
  resultFun: (result: SweetAlertResult) => void
) => {
  Swal.fire({
    ...DUPLICATE_OVERLAP_COMMON_SETTING,
    title: defaultStr(i18n.t("warning")),
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: defaultStr(i18n.t("button.cancel")),
    denyButtonText: defaultStr(i18n.t("button.continueCreate")),
    cancelButtonText: defaultStr(i18n.t("button.edit")),
    text: i18n.t("applog:create.ingestSetting.duplicatedIndexError"),
  }).then((result) => {
    return resultFun(result);
  });
};

export const convertOpenSearchTaskParameters = (
  pipelineTask: PartialServiceType,
  taskExcludeParams: string[],
  openSearch: OpenSearchState
) => {
  const resParamList: any[] = [];
  const EXCLUDE_PARAMS = [...taskExcludeParams, ...AOS_EXCLUDE_PARAMS];
  const lifecycleData = rolloverAndLogLifecycleTransformData(openSearch);
  const paramHandlers: { [key: string]: string } = {
    rolloverSize: lifecycleData.rolloverSize,
    warmAge: lifecycleData.warmLogTransition,
    coldAge: lifecycleData.coldLogTransition,
    retainAge: lifecycleData.logRetention,
  };
  Object.keys(pipelineTask.params).forEach((key) => {
    if (!EXCLUDE_PARAMS.includes(key)) {
      const value = paramHandlers[key] ?? (pipelineTask.params as any)[key];
      resParamList.push({ parameterKey: key, parameterValue: value });
    }
  });
  return resParamList;
};

export const validateOpenSearchParams = (openSearch: OpenSearchState) => {
  return !(
    openSearch?.domainNameError ||
    !DOMAIN_ALLOW_STATUS.includes(openSearch?.domainCheckedStatus?.status) ||
    validateShardNumbers(openSearch) ||
    validateRolloverSize(openSearch) ||
    validateWarmAge(openSearch) ||
    validateColdAge(openSearch) ||
    validateRetentionAge(openSearch) ||
    validateIndexPrefix(openSearch)
  );
};

export const openSearchSlice = createSlice({
  name: "openSearch",
  initialState: INIT_OPENSEARCH_DATA,
  reducers: {
    resetOpenSearch: (state) => {
      Object.assign(state, INIT_OPENSEARCH_DATA);
    },
    domainLoadingChanged: (state, { payload }: PayloadAction<boolean>) => {
      state.domainLoading = payload;
    },
    domainCheckStatusChanged: (
      state,
      { payload }: PayloadAction<DomainStatusCheckResponse | null>
    ) => {
      state.domainCheckedStatus = payload;
      state.replicaNumbers = payload?.multiAZWithStandbyEnabled ? "2" : "1";
    },
    openSearchClusterChanged: (
      state,
      { payload }: PayloadAction<DomainDetails>
    ) => {
      const NOT_SUPPORT_VERSION =
        payload?.engine === EngineType.Elasticsearch ||
        parseFloat(defaultStr(payload?.version)) < 1.3;
      state.domainName = payload.domainName;
      state.opensearchArn = defaultStr(payload?.domainArn);
      state.engineType = defaultStr(payload?.engine);
      state.esDomainId = defaultStr(payload?.id);
      state.endpoint = defaultStr(payload?.endpoint);
      state.securityGroupId = defaultStr(payload?.vpc?.securityGroupId);
      state.subnetIds = defaultStr(payload?.vpc?.privateSubnetIds);
      state.publicSubnetIds = defaultStr(payload?.vpc?.publicSubnetIds);
      state.vpcId = defaultStr(payload?.vpc?.vpcId);
      state.warmEnable = payload?.nodes?.warmEnabled ?? false;
      state.coldEnable = payload?.nodes?.coldEnabled ?? false;
      state.rolloverSizeNotSupport = NOT_SUPPORT_VERSION;
      state.enableRolloverByCapacity = !NOT_SUPPORT_VERSION;
      state.rolloverSize = NOT_SUPPORT_VERSION ? "" : "30";
    },
    indexPrefixChanged: (state, { payload }: PayloadAction<string>) => {
      state.indexPrefix = payload;
      state.indexPrefixError = "";
    },
    indexSuffixChanged: (state, { payload }: PayloadAction<string>) => {
      state.indexSuffix = payload;
    },
    appIndexSuffixChanged: (state, { payload }: PayloadAction<string>) => {
      state.appIndexSuffix = payload;
    },
    createDashboardChanged: (state, { payload }: PayloadAction<string>) => {
      state.createDashboard = payload;
    },
    shardNumbersChanged: (state, { payload }: PayloadAction<string>) => {
      state.shardNumbers = payload;
      state.shardsError = "";
    },
    replicaNumbersChanged: (state, { payload }: PayloadAction<string>) => {
      state.replicaNumbers = payload;
      state.capacityError = "";
    },
    enableRolloverByCapacityChanged: (
      state,
      { payload }: PayloadAction<boolean>
    ) => {
      state.enableRolloverByCapacity = payload;
    },
    rolloverSizeChanged: (state, { payload }: PayloadAction<string>) => {
      state.rolloverSize = payload;
      state.capacityError = "";
    },
    compressionTypeChanged: (state, { payload }: PayloadAction<string>) => {
      state.codec = payload;
    },
    warmTransitionTypeChanged: (state, { payload }: PayloadAction<string>) => {
      state.warmTransitionType = payload;
    },
    warmAgeChanged: (state, { payload }: PayloadAction<string>) => {
      state.warmAge = payload;
      state.coldLogError = "";
      state.warmLogError = "";
      state.retentionLogError = "";
    },
    coldAgeChanged: (state, { payload }: PayloadAction<string>) => {
      state.coldAge = payload;
      state.coldLogError = "";
      state.warmLogError = "";
      state.retentionLogError = "";
    },
    retainAgeChanged: (state, { payload }: PayloadAction<string>) => {
      state.retainAge = payload;
      state.coldLogError = "";
      state.warmLogError = "";
      state.retentionLogError = "";
    },
    validateOpenSearch: (state) => {
      state.indexPrefixError = validateIndexPrefix(state);
      if (validateIndexPrefix(state)) {
        state.showAdvancedSetting = true;
      }
      state.shardsError = validateShardNumbers(state);
      state.capacityError = validateRolloverSize(state);
      state.warmLogError = validateWarmAge(state);
      state.coldLogError = validateColdAge(state);
      state.retentionLogError = validateRetentionAge(state);
    },
    showAdvancedSettingChanged: (
      state,
      { payload }: PayloadAction<boolean>
    ) => {
      state.showAdvancedSetting = payload;
    },
  },
});

export const {
  resetOpenSearch,
  domainLoadingChanged,
  domainCheckStatusChanged,
  openSearchClusterChanged,
  createDashboardChanged,
  indexPrefixChanged,
  indexSuffixChanged,
  appIndexSuffixChanged,
  shardNumbersChanged,
  replicaNumbersChanged,
  enableRolloverByCapacityChanged,
  rolloverSizeChanged,
  compressionTypeChanged,
  warmTransitionTypeChanged,
  warmAgeChanged,
  coldAgeChanged,
  retainAgeChanged,
  validateOpenSearch,
  showAdvancedSettingChanged,
} = openSearchSlice.actions;
