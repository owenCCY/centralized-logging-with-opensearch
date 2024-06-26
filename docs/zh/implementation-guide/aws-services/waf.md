# AWS WAF 日志

[WAF 访问日志](https://docs.aws.amazon.com/waf/latest/developerguide/logging.html) 提供有关由您的 Web ACL 分析的流量的详细信息。 记录的信息包括 AWS WAF 从您的 AWS 资源收到 Web 请求的时间、有关请求的详细信息以及有关请求匹配的规则的详细信息。

您可以使用日志通控制台或通过部署独立的 CloudFormation 堆栈来将日志摄取到 [Amazon OpenSearch Service](#_1) 或者[Light Engine](#_4)分析引擎中。

!!! important "重要提示"

    - 日志通解决方案必须与 Web ACL 部署在同一个可用区中，否则您将无法创建WAF日志摄取。
    例如:
        - 如果您的 Web ACL 与 Global Cloudfront 相关联，那么您的日志通 必须部署在 us-east-1。
        - 如果您的 Web ACL 与在 Ohio 的 AWS 资源相关联，那么您的日志通 必须部署在 us-east-2。
    - WAF 日志存储桶必须和日志通 位于同一区域。
    - 日志通 不支持 [WAF Classic](https://docs.aws.amazon.com/waf/latest/developerguide/classic-waf-chapter.html) 产生的日志。您可以了解如何[从 WAF Classic 迁移到新 AWS WAF](https://aws.amazon.com/blogs/security/migrating-rules-from-aws-waf-classic-to-new-aws-waf/)。
    - 默认情况下，该解决方案将每天轮换索引。您可以在**额外设置**中进行调整。

## 创建日志摄取 (OpenSearch Engine)

### 使用日志通控制台

1. 登录日志通控制台。
2. 在导航窗格中的 **日志分析管道** 下，选择 **AWS 服务日志**。
3. 选择**创建日志摄取**按钮。
4. 在 **AWS 服务** 部分，选择 **AWS WAF**。
5. 选择**OpenSearch**,**下一步**。
6. 在 **指定设置** 下，选择 **自动** 或 **手动**。
   - 对于 **自动** 模式，在下拉列表中选择一个 Web ACL。
   - 对于 **手动** 模式，输入 **Web ACL name**。
   - (可选步骤) 如果需要跨账户摄取日志，需要先在 **账户** 的下拉列表中选择一个[链接的 AWS 账户](../link-account/index.md)。
7. 在 **摄取选项** 中. 选择 **采样** 或 **全量**.
   - 对于 **采样**， 请输入摄取采样日志的频率。
   - 对于 **全量**， 如果未启用 Web ACL 日志，请单击 **开启** 启用访问日志。或在手动模式中输入日志位置。请注意，使用日志通将自动启用使用 Kinesis Data Firehose 流作为 WAF 日志的目标。
8. 选择**下一步**。
9. 在 **指定 OpenSearch 域** 部分，为 **Amazon OpenSearch 域** 选择一个导入的域。
10. 如果您要摄取关联的模板化 Amazon OpenSearch Service 仪表板，请为 **示例仪表板** 选择 **是**。
11. 如果需要，您可以更改目标 Amazon OpenSearch Service 索引的 **索引前缀**。默认前缀是`Web ACL 名称`。
12. 在 **日志生命周期** 部分，输入管理 Amazon OpenSearch Service 索引生命周期的天数。日志通 将为此管道自动创建关联的 [索引状态管理 (ISM)](https://opensearch.org/docs/latest/im-plugin/ism/index/) 策略。
13. 在 **选择日志处理器** 部分，请选择日志处理器。
    - 当选择 Lambda 作为日志处理器时，您可以根据需要配置 Lambda 并发数。
    - （可选）这些[区域](https://aws.amazon.com/about-aws/whats-new/2023/04/amazon-opensearch-service-ingestion/)现在支持 OSI 作为日志处理器。 当选择 OSI 时，请输入 OCU 的最小和最大数量。 请参阅[此处](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ingestion.html#ingestion-scaling) 的更多信息。
14. 选择**下一步**。
15. 如果需要，添加标签。
16. 选择**创建**。

### 使用 CloudFormation 堆栈

此自动化 AWS CloudFormation 模板在 AWS 云中部署 _日志通- waf Log Ingestion_ 解决方案。

|                         | 从 AWS 控制台启动                                                                                                                                                                                                                  | 下载模板                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| AWS 海外区域 (全量请求) | [![启动堆栈](../../images/launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/new?templateURL=https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFLog.template){target=\_blank}        | [模板](https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFLog.template)        |
| AWS 中国区域 (全量请求) | [![启动堆栈](../../images/launch-stack.png)](https://console.amazonaws.cn/cloudformation/home#/stacks/new?templateURL=https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFLog.template){target=\_blank}          | [模板](https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFLog.template)        |
| AWS 海外区域 (采样请求) | [![启动堆栈](../../images/launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/new?templateURL=https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFSampledLog.template){target=\_blank} | [模板](https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFSampledLog.template) |
| AWS 中国区域 (采样请求) | [![启动堆栈](../../images/launch-stack.png)](https://console.amazonaws.cn/cloudformation/home#/stacks/new?templateURL=https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFSampledLog.template){target=\_blank}   | [模板](https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/WAFSampledLog.template) |

1.  登录 AWS 管理控制台并选择以上按钮以启动 AWS CloudFormation 模板。您还可以下载模板开始部署。

2.  要在不同的 AWS 区域中启动堆栈，请使用控制台导航栏中的区域选择器。

3.  在 **创建堆栈** 页面上，验证正确的模板 URL 显示在 **Amazon S3 URL** 文本框中，然后选择 **下一步**。

4.  在 **指定堆栈详细信息** 页面上，为您的解决方案堆栈分配一个名称。

5.  在 **参数** 下，查看模板的参数并根据需要进行修改。此解决方案使用以下参数。

    - **全量请求** 专用参数

    | 参数              | 默认         | 描述                           |
    | ----------------- | ------------ | ------------------------------ |
    | Log Bucket Name   | `<需要输入>` | 存储日志的 S3 存储桶名称。     |
    | Log Bucket Prefix | `<需要输入>` | 存储日志的 S3 存储桶路径前缀。 |

    - **采样请求** 专用参数

    | 参数         | 默认         | 描述                                                            |
    | ------------ | ------------ | --------------------------------------------------------------- |
    | WebACL Names | `<需要输入>` | WebACL 名称列表，以逗号分隔。                                   |
    | Interval     | `2`          | 获取采样日志的默认时间间隔（以分钟为单位）,该值必须>=2 且<180。 |

    - 通用参数

    | 参数                                     | 默认             | 描述                                                                                                                                                                  |
    | ---------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | Log Bucket Name                          | `<需要输入>`     | 存储日志的 S3 存储桶名称。                                                                                                                                            |
    | Log Bucket Prefix                        | `<需要输入>`     | 存储日志的 S3 存储桶路径前缀。                                                                                                                                        |
    | Log Source Account ID                    | `<可选输入>`     | 存储日志的 S3 存储桶所在账户 ID. 对于跨账户日志摄取是必填 (需要先 [添加一个成员账户](../link-account/index.md))。 默认情况下, 会使用您在 **步骤 1** 中登录的账户 ID。 |
    | Log Source Region                        | `<可选输入>`     | 存储日志的 S3 存储桶所在的区域. 默认情况下, 会使用您在 **步骤 2** 中指定的区域。                                                                                      |
    | Log Source Account Assume Role           | `<可选输入>`     | 跨账户日志摄取所需要使用的 IAM Role. 对于跨账户日志摄取是必填 (需要先 [添加一个成员账户](../link-account/index.md))。                                                 |
    | KMS-CMK ARN                              | `<可选输入>`     | 用于加密的 KMS-CMK ARN。 留空以创建新的 KMS CMK。                                                                                                                     |
    | Enable OpenSearch Ingestion as processor | `<可选输入>`     | Ingestion 表 Arn。如果不使用 OSI 作为处理器，请留空。                                                                                                                 |
    | S3 Backup Bucket                         | `<需要输入>`     | 用于存储失败提取日志的 S3 备份存储桶名称。                                                                                                                            |
    | Engine Type                              | OpenSearch       | OpenSearch 的引擎类型。选择 OpenSearch 或 Elasticsearch。                                                                                                             |
    | OpenSearch Domain Name                   | `<需要输入>`     | Amazon OpenSearch 集群的域名。                                                                                                                                        |
    | OpenSearch Endpoint                      | `<需要输入>`     | OpenSearch 端点 URL。例如，`vpc-your_opensearch_domain_name-xcvgw6uu2o6zafsiefxubwuohe.us-east-1.es.amazonaws.com`。                                                  |
    | Index Prefix                             | `<需要输入>`     | 日志的 OpenSearch 索引的公共前缀。索引名称将为 `<Index Prefix>-<log-type>-<YYYY-MM-DD>`。                                                                             |
    | Create Sample Dashboard                  | Yes              | 是否创建示例 OpenSearch 仪表板。                                                                                                                                      |
    | VPC ID                                   | `<需要输入>`     | 选择可以访问 OpenSearch 域的 VPC。日志处理 Lambda 将驻留在选定的 VPC 中。                                                                                             |
    | Subnet IDs                               | `<需要输入>`     | 选择至少两个可以访问 OpenSearch 域的子网。日志处理 Lambda 将驻留在子网中。确保子网可以访问 Amazon S3 服务。                                                           |
    | Security Group ID                        | `<需要输入>`     | 选择将与日志处理 Lambda 关联的安全组。确保安全组有权访问 OpenSearch 域。                                                                                              |
    | Number Of Shards                         | 5                | 将索引均匀分布在所有数据节点上的分片数。将每个分片的大小保持在 10-50 GiB 之间。                                                                                       |
    | Number of Replicas                       | 1                | OpenSearch 索引的副本数。每个副本都是索引的完整副本。                                                                                                                 |
    | Age to Warm Storage                      | `<可选输入>`     | 将索引移至温存储所需的时间（例如 7d）。索引时间是从创建到现在之间的时间。支持的单位是 d（天）和 h（小时）。仅当 OpenSearch 中启用了温存储时才生效。                   |
    | Age to Cold Storage                      | `<可选输入>`     | 将索引移入冷存储所需的时间（例如 30d）。索引时间是从创建到现在之间的时间。支持的单位是 d（天）和 h（小时）。仅当 OpenSearch 中启用了冷存储时才生效。                  |
    | Age to Retain                            | `<可选输入>`     | 保留索引的时间（例如 180d）。索引时间是从创建到现在之间的时间。支持的单位是 d（天）和 h（小时）。如果值为空，则不会删除该索引。                                       |
    | Rollover Index Size                      | `<可选输入>`     | 索引滚动所需的分片大小（例如 30GB）。                                                                                                                                 |
    | Index Suffix                             | yyyy-MM-dd       | 索引后缀格式（例如：yyyy-MM-dd、yyyy-MM-dd-HH）。索引名称将为 `<Index Prefix>-<Log Type>-<Index Suffix>-000001`。                                                     |
    | Compression type                         | best_compression | 用于压缩存储数据的压缩类型。 可用值为 best_compression 和 default。                                                                                                   |
    | Refresh Interval                         | 1s               | 索引多久刷新，即刷新索引最近的更改数据并使它们可用于搜索。 可以设置为 -1 以禁用刷新。 默认为 1 秒。                                                                   |
    | EnableS3Notification                     | True             | 一个二进制选项，用于启用或禁用针对 Amazon S3 存储桶的通知。大多数情况下，建议使用默认选项。                                                                           |
    | LogProcessorRoleName                     | `<可选>`         | 为日志处理器指定一个角色名称。该名称不能与现有角色名称重复。如果没有指定名称，将生成一个随机名称。可选参数，不是必填项。                                              |
    | QueueName                                | `<可选>`         | 为 SQS 指定一个队列名称。该名称不能与现有角色名称重复。如果没有指定名称，将生成一个随机名称。可选参数，不是必填项。                                                   |

6.  选择**下一步**。

7.  在 **配置堆栈选项** 页面上，选择 **下一步**。

8.  在 **审核** 页面上，查看并确认设置。选中确认模板创建 AWS Identity and Access Management (IAM) 资源的复选框。

9.  选择 **创建堆栈** 部署堆栈。

您可以在 AWS CloudFormation 控制台的 **状态** 列中查看堆栈的状态。正常情况下，您大约 10 分钟后会看到 **CREATE_COMPLETE** 状态。

### 查看仪表板

该仪表板包括以下可视化图表。

| 可视化名称                        | 源字段                                                          | 描述                                                                                 |
| --------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Filters                           | <ul><li> Filters </li></ul>                                     | 可以通过查询过滤条件对以下数据进行筛选。                                             |
| Web ACLs                          | <ul><li> log event</li><li>webaclName</li></ul>                 | 显示按 Web ACL 名称分组的请求总数。                                                  |
| Total Requests                    | <ul><li> log event </li></ul>                                   | 显示总的 Web 请求数。                                                                |
| Request Timeline                  | <ul><li> log event </li></ul>                                   | 提供一个柱状图，显示随时间分布的事件情况。                                           |
| WAF Rules                         | <ul><li> terminatingRuleId </li></ul>                           | 提供一个饼图，显示 Web ACL 中的 WAF 规则分布情况。                                   |
| Total Blocked Requests            | <ul><li> log event </li></ul>                                   | 显示被阻止的 Web 请求总数。                                                          |
| Unique Client IPs                 | <ul><li> Request.ClientIP</li></ul>                             | 显示通过客户端 IP 地址识别的唯一访问者。                                             |
| Country or Region By Request      | <ul><li> Request.Country </li></ul>                             | 显示 Web ACL 上的请求数（按客户端 IP 解析的相应国家或地区分组）。                    |
| Http Methods                      | <ul><li> Request.HTTPMethod</li></ul>                           | 使用饼图显示 Web ACL 上的请求数（按 HTTP 请求方法名称分组，如 POST、GET、HEAD 等）。 |
| Http Versions                     | <ul><li> Request.HTTPVersion</li></ul>                          | 使用饼图显示 Web ACL 上的请求数（按 HTTP 协议版本分组，如 HTTP/2.0、HTTP/1.1 等）。  |
| Top WebACLs                       | <ul><li> webaclName</li><li> webaclId.keyword</li></ul>         | Web 请求视图使您能够分析顶级 Web 请求。                                              |
| Top Hosts                         | <ul><li> host</li></ul>                                         | 列出与事件关联的源 IP 地址，使您能够识别和调查潜在的可疑或未经授权的活动。           |
| Top Request URIs                  | <ul><li> Request.URI</li></ul>                                  | 前 10 个请求 URI。                                                                   |
| Top Countries or Regions          | <ul><li> Request.country</li></ul>                              | Web ACL 访问中前 10 个国家。                                                         |
| Top Rules                         | <ul><li> terminatingRuleId</li></ul>                            | Web ACL 中匹配请求的前 10 条规则。                                                   |
| Top Client IPs                    | <ul><li> Request.ClientIP</li></ul>                             | 提供前 10 个 IP 地址。                                                               |
| Top User Agents                   | <ul><li> userAgent</li></ul>                                    | 提供前 10 个用户代理。                                                               |
| Block Allow Host Uri              | <ul><li> host</li><li>Request.URI</li><li>action</li></ul>      | 提供被阻止或允许的 Web 请求。                                                        |
| Top Labels with Host, Uri         | <ul><li> labels.name</li><li>host</li><li>Request.URI</li></ul> | 使用主机和 URI 的标签的前 10 个详细日志。                                            |
| View by Matching Rule             | <ul><li> sc-status</li></ul>                                    | 该可视化图表提供了由 DQL“terminatingRuleId:\*”提供的详细日志。                       |
| View by httpRequest args,uri,path | <ul><li> sc-status</li></ul>                                    | 该可视化图表提供了由 DQL 提供的详细日志。                                            |

#### 示例仪表板

{%
include-markdown "../include-dashboard.md"
%}

[![waf-db]][waf-db]

[waf-db]: ../../images/dashboards/waf-db.png

## 创建日志摄取（Light Engine）

### 使用日志通控制台

1. 登录日志通控制台。
2. 在导航窗格中的 **日志分析管道** 下，选择 **AWS 服务日志**。
3. 选择**创建日志摄取**按钮。
4. 在 **AWS 服务** 部分，选择 **AWS WAF**。
5. 选择**Light Engine**,**下一步**。
6. 在 **指定设置** 下，选择 **自动** 或 **手动**。
   - 对于 **自动** 模式，在下拉列表中选择一个 Web ACL。
   - 对于 **手动** 模式，输入 **Web ACL name**。
   - (可选步骤) 如果需要跨账户摄取日志，需要先在 **账户** 的下拉列表中选择一个[链接的 AWS 账户](../link-account/index.md)。
7. 在 **摄取选项** 中. 选择 **全量**.
   - 对于 **全量**， 如果未启用 Web ACL 日志，请单击 **开启** 启用访问日志。或在手动模式中输入日志位置。请注意，使用日志通将自动启用使用 Kinesis Data Firehose 流作为 WAF 日志的目标。
8. 选择**下一步**。
9. 在 **指定 Light Engine 配置** 部分，如果您要摄取关联的模板化 Grafana 仪表板，请为 **样例看板** 选择 **是**。
10. 你可以选择一个 Grafana，如果需要**导入**一个新的 Grafana，可以跳转到[Grafana](../resources/grafana.md)进行配置。
11. 选择一个 S3 桶存放分区后的日志。并且定义一个用于存放日志表的名称，我们已经为你预定义了一个表名，你可以根据你的业务需求进行修改。
12. 日志处理频率，默认为**5**分钟，最小时间处理频率为**1**分钟。
13. 在 **日志生命周期** 部分，输入管理 日志合并时间 和 日志归档时间。我们为你提供了默认值，你可以根据你的业务需求来进行调整。
14. 选择**下一步**。
15. 如果需要，添加标签。
16. 选择**创建**。

### 使用 CloudFormation 堆栈

|                         | 从 AWS 控制台启动                                                                                                                                                                                                                                     | 下载模板                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| AWS 海外区域 (全量请求) | [![启动堆栈](../../images/launch-stack.png)](https://console.aws.amazon.com/cloudformation/home#/stacks/new?templateURL=https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/MicroBatchAwsServicesWafPipeline.template){target=\_blank} | [模板](https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/MicroBatchAwsServicesWafPipeline.template) |
| AWS 中国区域 (全量请求) | [![启动堆栈](../../images/launch-stack.png)](https://console.amazonaws.cn/cloudformation/home#/stacks/new?templateURL=https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/MicroBatchAwsServicesWafPipeline.template){target=\_blank}   | [模板](https://{{ bucket }}.s3.amazonaws.com/{{ solution }}/{{ version }}/MicroBatchAwsServicesWafPipeline.template) |

1. 登录 AWS 管理控制台并选择以上按钮以启动 AWS CloudFormation 模板。您还可以下载模板开始部署。

2. 要在不同的 AWS 区域中启动堆栈，请使用控制台导航栏中的区域选择器。

3. 在 **创建堆栈** 页面上，验证正确的模板 URL 显示在 **Amazon S3 URL** 文本框中，然后选择 **下一步**。

4. 在 **指定堆栈详细信息** 页面上，为您的解决方案堆栈分配一个名称。

5. 在 **参数** 下，查看模板的参数并根据需要进行修改。此解决方案使用以下参数。

   - **Pipeline settings** 专用参数

   | 参数                  | 默认            | 描述                                                                                                                                                                                                   |
   | --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | Pipeline Id           | `<需要输入>`    | pipeline 的唯一标识符，如果您需要创建多个 waf pipeline，将不同的 waf 日志写入到不同的表中时，则必须保证唯一性，可以通过[uuidgenerator](https://www.uuidgenerator.net/version4)生成唯一的 Pipeline Id。 |
   | Staging Bucket Prefix | AWSLogs/WAFLogs | 日志在临时存储区的存放目录，不同 pipeline 要保证 Prefix 的唯一性且无重叠。                                                                                                                             |

   - **Destination settings** 专用参数

   | 参数                      | 默认         | 描述                                                                                                                                                                   |
   | ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Centralized Bucket Name   | `<需要输入>` | 输入 centralized 的 s3 bucket 名称，例如 centralized-logging-bucket。                                                                                                  |
   | Centralized Bucket Prefix | datalake     | 输入 centralized bucket 的路径前缀，默认为 datalake，意味着您的数据库的 location 为 s3://{Centralized Bucket Name}/{Centralized Bucket Prefix}/amazon_cl_centralized。 |
   | Centralized Table Name    | WAF          | 数据写入到 Centralized 数据库的表名称，按需定义，默认值为 waf。                                                                                                        |

   - **Scheduler settings** 专用参数

   | 参数                             | 默认               | 描述                                                                                                                                                              |
   | -------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | LogProcessor Schedule Expression | rate(5 minutes)    | 执行数据加工的任务周期表达式，默认值为每 5 分钟执行一次 LogProcessorr，配置[可参考](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html)。 |
   | LogMerger Schedule Expression    | cron(0 1 \* _ ? _) | 执行数据文件合并的任务周期表达式，默认值为每天 1 点执行 LogMerger,配置[可参考](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html)。      |
   | LogArchive Schedule Expression   | cron(0 2 \* _ ? _) | 执行数据归档的任务周期表达式，默认值为每天 2 点执行 LogArchive，配置[可参考](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html)。        |
   | Age to Merge                     | 7                  | 小文件保留天数，默认值为 7，表示会对 7 天以前的日志进行小文件合并，可按需调整。                                                                                   |
   | Age to Archive                   | 30                 | 日志保留天数，默认值为 30，表示 30 天以前的数据会进行归档删除，可按需调整。                                                                                       |

   - **Notification settings** 专用参数

   | 参数                 | 默认         | 描述                                                                                                                                                                                                                                                    |
   | -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Notification Service | SNS          | 告警通知方式，如果您的主栈是使用 China，则只能选择 SNS 方式，如果您的主栈是使用 Global，则可以使用 SNS 或 SES 方式。                                                                                                                                    |
   | Recipients           | `<需要输入>` | 告警通知，如果 Notification Service 为 SNS，则此处输入 SNS 的 Topic arn，确保有权限，如果 Notification Service 为 SES，则此处输入邮箱地址，以逗号分隔，确保邮件地址已在 SES 中 Verified identities，创建主 stack 输入的 adminEmail 默认会发送验证邮件。 |

   - **Dashboard settings** 专用参数

   | 参数                          | 默认         | 描述                                                                                                                       |
   | ----------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
   | Import Dashboards             | FALSE        | 是否导入 Dashboard 到 Grafana 中，默认值为 false，如设置为 true，则必须填写 Grafana URL 和 Grafana Service Account Token。 |
   | Grafana URL                   | `<可选输入>` | Grafana 访问的 URL，例如https://alb-72277319.us-west-2.elb.amazonaws.com。                                                 |
   | Grafana Service Account Token | `<可选输入>` | Grafana Service Account Token：Grafana 中创建的 Service Account Token。                                                    |
   |                               |

6. 选择**下一步**。

7. 在 **配置堆栈选项** 页面上，选择 **下一步**。

8. 在 **审核** 页面上，查看并确认设置。选中确认模板创建 AWS Identity and Access Management (IAM) 资源的复选框。

9. 选择 **创建堆栈** 部署堆栈。

您可以在 AWS CloudFormation 控制台的 **状态** 列中查看堆栈的状态。正常情况下，您大约 10 分钟后会看到 **CREATE_COMPLETE** 状态。

### 查看仪表板

该仪表板包括以下可视化图表。

| 可视化名称                            | 源字段                                                                                                                                                                                                  | 描述                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Filters                               | Filters                                                                                                                                                                                                 | 可以通过查询过滤条件对以下数据进行筛选。                                             |
| Total Requests                        | log event                                                                                                                                                                                               | 显示总的 Web 请求数。                                                                |
| Total Blocked Requests                | log event                                                                                                                                                                                               | 显示被阻止的 Web 请求总数。                                                          |
| Requests History                      | log event                                                                                                                                                                                               | 提供一个柱状图，显示随时间分布的事件情况。                                           |
| WAF ACLs                              | log event <br/>webaclName                                                                                                                                                                               | 显示按 Web ACL 名称分组的请求总数。                                                  |
| WAF Rules                             | terminatingRuleId                                                                                                                                                                                       | 提供一个饼图，显示 Web ACL 中的 WAF 规则分布情况。                                   |
| Sources                               | httpSourceId                                                                                                                                                                                            | 提供一个饼图，显示被分配资源 ID 的分布情况。                                         |
| HTTP Methods                          | httpRequest.HTTPMethod                                                                                                                                                                                  | 使用饼图显示 Web ACL 上的请求数（按 HTTP 请求方法名称分组，如 POST、GET、HEAD 等）。 |
| Country or Region By Blocked Requests | HTTPRequest.Country                                                                                                                                                                                     | 显示 Web ACL 上的被阻止的请求数（按客户端 IP 解析的相应国家或地区分组）。            |
| Top WebACLs                           | webaclName                                                                                                                                                                                              | Web 请求视图使您能够分析顶级 Web 请求。                                              |
| Top Sources                           | httpSourceId                                                                                                                                                                                            | 前 10 个被分配的资源 ID。                                                            |
| Top Requests URIs                     | httpRequest.URI                                                                                                                                                                                         | 前 10 个请求 URI。                                                                   |
| Top Countries or Regions              | httpRequest.country                                                                                                                                                                                     | Web ACL 访问中前 10 个国家。                                                         |
| Top Rules                             | terminatingRuleId                                                                                                                                                                                       | Web ACL 中匹配请求的前 10 条规则。                                                   |
| Top Client IPs                        | httpRequest.ClientIP                                                                                                                                                                                    | 提供前 10 个 IP 地址。                                                               |
| Top Blocked / Allowed Hosts URI       | host httpRequest.URI action                                                                                                                                                                             | 提供被阻止或允许的 Web 请求。                                                        |
| Top Labels with Host, URI             | labels host httpRequest.URI                                                                                                                                                                             | 使用主机和 URI 的标签的前 10 个详细日志。                                            |
| Metrics                               | webaclId <br/>webaclName terminatingRuleId <br/>terminatingRuleType <br/>httpSourceId <br/>httpRequest.HTTPMethod <br/>httpRequest.country <br/>httpRequest.ClientIP labels <br/>httpRequest.URI action | 提供详细的日志指标列表，包括时间戳、WebACL、客户端 IP 等。                           |

####示例仪表板
![waf](../../images/dashboards/waf-light.jpg)
