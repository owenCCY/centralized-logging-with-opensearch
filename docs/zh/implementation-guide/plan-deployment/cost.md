# 费用预估

!!! Important "重要"

    本节中描述的成本估算只是示例，可能会因您的环境而异。


您需要承担运行解决方案时使用亚马逊云科技各个服务的成本费用。影响解决方案成本的主要因素包括：

- 要摄取的日志类型
- 要摄取/处理的日志量
- 日志消息的大小
- 日志的位置
- 额外的特性

以下示例将演示截至最新发布的版本，基于亚马逊云科技美国东部（弗吉尼亚北部）区域 (us-east-1) 10/100/1000 GB 每日日志摄取的成本估算。 总成本包括 **日志分析引擎**： [**Amazon OpenSearch 费用**](#amazon-opensearch)或[**Light Engine费用**](#light-engine)、[**处理费用**](#_1) 和 [**额外特性费用**](#_4)。

## 使用Amazon OpenSearch 作为日志分析引擎时的费用

### Amazon OpenSearch 费用

- **OD**: 按需实例价格模型
- **AURI_1**: 全额预付1年预留实例
- **分层**：存储在层中的天数。 例如，7H + 23W + 60C 表示日志在热层存储 7 天，温层存储 23 天，冷层存储 60 天。
- **副本**: 分片副本的数量。

| 每日日志量 (GB)	 | 存储 (天)	 | 分层	              | 副本	 | OD 每月 (USD)	 | AURI_1 每月  (USD)	 | 专用主节点	        | 数据节点	           | EBS (GB)	 | UltraWarm 节点	 | UltraWarm/Cold S3 存储 (GB)	 | OD 每GB费用 (USD)	 | AURI_1 每GB费用 (USD)	 |
|-------------|---------|------------------|-----|------------|-----------------|---------------|-----------------|--------------------------|---------------|----------------------------|---------------|-------------------|
| 10	         | 30	     | 30H	             | 0	  | 216.28	    | 158.54	         | N/A	          | c6g.large[2]	   | 380	      | N/A	          | 0	                         | 0.72093	      | 0.52847	          |
| 10	         | 30	     | 30H	             | 1	  | 289.35	    | 223.94	         | N/A	          | m6g.large[2]	   | 760	      | N/A	          | 0	                         | 0.9645	       | 0.74647	          |
| 100	        | 30	     | 7H + 23W	        | 0	  | 989.49	    | 825.97	         | m6g.large[3]	 | m6g.large[2]	   | 886	      | medium[2]	    | 0	                         | 0.32983	      | 0.27532	          |
| 100	        | 30	     | 7H + 23W	        | 1	  | 1295.85	   | 1066.92	        | m6g.large[3]	 | m6g.large[4]	   | 1772	     | medium[2]	    | 0	                         | 0.43195	      | 0.35564	          |
| 100	        | 90	     | 7H + 23W + 60C	  | 0	  | 1133.49	   | 969.97	         | m6g.large[3]	 | m6g.large[2]	   | 886	      | medium[2]	    | 8300	                      | 0.12594	      | 0.10777	          |
| 100	        | 90	     | 7H + 23W + 60C	  | 1	  | 1439.85	   | 1210.92	        | m6g.large[3]	 | m6g.large[4]	   | 1772	     | medium[2]	    | 8300	                      | 0.15998	      | 0.13455	          |
| 100	        | 180	    | 7H + 23W + 150C	 | 0	  | 1349.49	   | 1185.97	        | m6g.large[3]	 | m6g.large[2]	   | 886	      | medium[2]	    | 17300	                     | 0.07497	      | 0.06589	          |
| 100	        | 180	    | 7H + 23W + 150C	 | 1	  | 1655.85	   | 1426.92	        | m6g.large[3]	 | m6g.large[4]	   | 1772	     | medium[2]	    | 17300	                     | 0.09199	      | 0.07927	          |
| 1000	       | 30	     | 7H + 23W	        | 0	  | 6101.15	   | 5489.48	        | m6g.large[3]	 | r6g.xlarge[6]	  | 8856	     | medium[15]	   | 23000	                     | 0.20337	      | 0.18298	          |
| 1000	       | 30	     | 7H + 23W	        | 1	  | 8759.49	   | 7635.8	         | m6g.large[3]	 | r6g.2xlarge[6]	 | 17712	    | medium[15]	   | 23000	                     | 0.29198	      | 0.25453	          |
| 1000	       | 90	     | 7H + 23W + 60C	  | 0	  | 8027.33	   | 7245.45	        | m6g.large[3]	 | r6g.xlarge[6]	  | 8856	     | medium[15]	   | 83000	                     | 0.08919	      | 0.0805	           |
| 1000	       | 90	     | 7H + 23W + 60C	  | 1	  | 10199.49	  | 9075.8	         | m6g.large[3]	 | r6g.2xlarge[6]	 | 17712	    | medium[15]	   | 83000	                     | 0.11333	      | 0.10084	          |
| 1000	       | 180	    | 7H + 23W + 150C	 | 0	  | 9701.15	   | 9089.48	        | m6g.large[3]	 | r6g.xlarge[6]	  | 8856	     | medium[15]	   | 173000	                    | 0.0539	       | 0.0505	           |
| 1000	       | 180	    | 7H + 23W + 150C	 | 1	  | 12644.19	  | 11420.86	       | m6g.large[3]	 | r6g.2xlarge[6]	 | 17712	    | medium[15]	   | 173000	                    | 0.07025	      | 0.06345	          |

### 处理费用

#### 通过 Amazon S3 提取日志

!!! note "信息"

    本节适用于：

    - AWS 服务日志包括 Amazon S3 访问日志，CloudFront 标准日志，CloudTrail 日志 (S3)，Application Load Balancing 访问日志，WAF 日志，VPC 流 日志 (S3)，AWS Config 日志，Amazon RDS/Aurora 日志，AWS Lambda 日志。
    - 使用 Amazon S3 作为数据缓冲区的应用日志。


以下是假设：

- 日志以 gzip 格式保存到 Amazon S3。
- S3 中 4MB 的压缩日志文件的原始日志大小约为 100MB。
- 一个 1GB 内存的 Lambda 处理一个 4MB 的压缩日志文件大约需要 26 秒，即每 MB 原始日志需要 260 毫秒。
- 最大压缩日志文件大小为 5MB。
- 从 S3 提取 AWS 服务日志会产生非常低的 SQS 和 S3 请求费用，或者通常在 AWS 免费套餐内。

您每天有 `N` GB 原始日志，每日成本估算如下：

**当您使用 Lambda 作为日志处理器时:**

- Lambda 成本 = 每 MB 260 毫秒 x 1024 MB x `N` GB/天 x 每毫秒 0.0000000167 美元
- S3 存储成本 = 每 GB 0.023 美元 x `N` GB/天 x 4%（压缩）

**当您使用 OSI 作为日志处理器时:**

- OSI Pipeline 成本 = $0.24 每 OCU 每 hour
- 1个OCU可处理的最大S3数据量约为20MB/s

处理 AWS 服务日志的每月总成本为：

**每月总成本（Lambda作为日志处理器）** =（Lambda 成本 + S3 存储成本）x 30 天

| 每日的日志量 | 每日的 Lambda 费用 ($) | 每次的 S3 存储费用 ($) | 每月的费用 ($) |
|-------|------------------|----------------|----------|
| 10    | 0.044            | 0.009          | 1.610    |
| 100   | 0.445            | 0.092          | 16.099   |
| 1000  | 4.446            | 0.920          | 160.986  |
| 5000             | 22.23                   | 4.600                       | 804.900            |

**Total 每月的总费用 (OSI 作为日志处理器)** = (OSI 成本 + S3 Storage 成本) x 30 天

| 每日的日志量 | 每日的 OSI 费用 ( $) | 每次的 S3 存储费用 ( $) | 每月的费用 ( $) |
| ---------------- | ----------------------- | --------------------------- | ------------------ |
| 10               | 5.760                   | 0.001                       | 173.1              |
| 100              | 5.760                   | 0.009                       | 175.5              |
| 1000             | 11.52                   | 0.920                       | 373.2              |
| 5000             | 34.56                   | 4.600                       | 1174.8             |

对于记录到Amazon CloudWatch 的 Amazon RDS/Aurora 日志和 AWS Lambda 日志，除了上面列出的 S3 和 Lambda 成本外，还有使用Kinesis Data Firehose (KDF) 来订阅 CloudWatch 日志流并将它们放入Amazon S3桶的额外成本，KDF 以 5KB 为增量收费（每条记录小于 5KB 按 5KB 计费）。 假设日志大小为每条记录 0.2 KB，则每天的 KDF 成本估算如下：

* Kinesis Data Firehose 成本 = 每 GB 0.029 美元 x `N` GB/天 x (5KB/0.2 KB)

例如，每天 1GB 的日志，KDF 的每月额外费用为 21.75 美元。

!!! important "重要"

    为了节约 KDF 的成本，请确保您只记录需要的日志。 例如，除非需要，否则不要打开 RDS 常规日志(General Log)。


#### 通过 Amazon Kinesis Data Streams (KDS) 提取日志

!!! note "信息"

    本节适用于：

    - AWS 服务日志包括 CloudFront 实时日志，CloudTrail 日志 (CloudWatch)，VPC 流日志 (CloudWatch).
    - 使用 Amazon KDS 作为数据缓冲区的应用日志

!!! Important "重要"

    AWS服务使用日志功能的成本不包括在以下估算中，例如，CloudFront 使用实时日志会根据生成的日志行数收费（每 1,000,000 行日志行 0.01 美元）。 对于启用 CloudWatch 日志记录的 CloudTrail 和 VPC 流日志，还有日志传输到 CloudWatch 的费用。 请查看服务定价以了解更多详情。

成本估算基于以下假设和事实：

- 平均日志消息大小为 1 KB。
- 每日日志量为`L`GB。
- Lambda 内存为 1024 MB。
- 每个 Lambda 调用处理 1 MB 日志。
- 一个 Lambda 调用处理 Kinesis 的一个分片，Lambda 可以扩展到更多并发创新以处理多个分片。
- 处理小于 5 MB 的日志的 Lambda 运行时为 500 毫秒。
- 提供 30% 的额外分片来处理流量抖动。
- 一个 Kinesis 分片引入日志大小为 = 1 MB/秒 x 3600 秒/小时 x 24 小时 x 0.7 = 60.48 GB/天。
- 所需的 Kinesis 分片数 `S` = Round_up_to_next_integer（每日日志量 `L` / 60.48）。


基于上述假设，以下是每日成本估算公式：

- Kinesis 分片小时成本 = 0.015 USD/分片小时 x 每天 24 小时 x `S`分片
- Kinesis PUT 有效负载单位成本 = 每百万单位 0.014 USD x 100 万/GB x `L`GB/天
- Lambda 成本 = 0.0000000167 USD/1ms x 500 毫秒/调用 x 1000 次调用/GB x `L`GB/天

**每月总成本** =（Kinesis Shard 小时成本 + Kinesis PUT 有效负载单位成本 + Lambda 成本）x 30 天

| 每日的日志量 (GB) | 分片数 | 每日 Kinesis 分片小时费 | 每日 Kinesis PUT 有效负载费用 | 每次的 Lambda 费用 | 每月的总费用 (USD) |
|------------|-----|------------------|-----------------------|--------------|-----------|
| 10         | 1   | 0.36             | 0.14                  | 0.0835       | 17.505    |
| 100        | 2   | 0.72             | 1.4                   | 0.835        | 88.65     |
| 1000       | 17  | 6.12             | 14                    | 8.35         | 854.1     |

## 使用 Light Engine 作为日志分析引擎费用

**示例1 -- 原始日志大小: 10GB/天，查询大小: 50GB/天**

| 服务             | 每月的总费用 (USD) |
|----------------------|--------------------|
| Amazon S3            | $1.49              |
| Amazon Lambda        | $0.37              |
| Amazon SQS           | $0.00              |
| Amazon DynamoDB      | $3.79              |
| Amazon Step Function | $8.07              |
| Amazon SNS           | $0.18              |
| Amazon Athena        | $7.25              |
| Amazon EC2*          | $29.20             |
| **Total**                | **$50.35**             |

**示例2 --原始日志大小: 100GB/天，查询大小: 300GB/天**

| 服务             | 每月的总费用 (USD) |
|----------------------|--------------------|
| Amazon S3            | $19.98.00          |
| Amazon Lambda        | $0.73              |
| Amazon SQS           | $0.00              |
| Amazon DynamoDB      | $3.79              |
| Amazon Step Function | $16.14             |
| Amazon SNS           | $0.18              |
| Amazon Athena        | $43.51             |
| Amazon EC2*          | $29.20             |
| **Total**                | **$113.53**            |

**示例3 --原始日志大小: 1TB/天，查询大小: 1TB/天**

| 服务             | 每月的总费用 (USD) |
|----------------------|--------------------|
| Amazon S3            | $148.99            |
| Amazon Lambda        | $1.10              |
| Amazon SQS           | $0.00              |
| Amazon DynamoDB      | $3.79              |
| Amazon Step Function | $26.90             |
| Amazon SNS           | $0.18              |
| Amazon Athena        | $148.54            |
| Amazon EC2*          | $29.20             |
| **Total**               | **$358.70**            |

## 解决方案控制台成本
部署解决方案时会自动创建 Web 控制台。 假设一个月（30天）控制台访问次数为3000次，则将产生以下费用：

!!! Note "注意"

    AWS Step Functions, Amazon CloudWatch, AWS Systems Manager, 和 Amazon EventBridge 均属于免费套餐。

| 服务 | 每月的总费用 (USD) |
| --------------------- | ------ |
| Amazon CloudFront (1GB Data Transfer Out to Internet and 1GB Data Transfer Out to Origin) | 0.25 |
| Amazon S3 | 0.027 |
| Amazon Cognito | 0.05 |
| AWS AppSync | 0.01 |
| Amazon DynamoDB | 1.00 |
| AWS Lambda | 0.132 |
| Total | 1.469 |

## 额外特性费用

!!! Note "注意"

     如果您选择不使用日志通控制台中的附加功能，则不会向您收费。

### 访问代理

如果通过日志通部署并创建了[访问代理](../domains/proxy.md)，将收取以下费用。根据您选择的实例类型和实例数量，总成本会有所不同。 以下是两个示例供您参考（基于截至最新发布版本的 us-east-1 价格）。

**示例 1: 实例类型 - t3.nano, 2台**

- EC2 成本 = t3.nano 1Y 全部预付预留实例 $26.28 x 2 / 12 个月 = $4.38/月
- EBS 成本 = 0.1 GB/月 x 8 GB x 2 = $1.6/月
- 弹性负载均衡器成本 = 每 ALB 小时 $0.0225 x 720 小时/月 = $16.2/月

**每月总费用** = 4.38 美元 EC2 成本 + 1.6 美元 EBS 成本 + 16.2 美元弹性负载均衡器成本 = **22.18 美元**

**示例 2: 实例类型 - t3.large, 2台**

- EC2 成本 = t3.large 1Y 全部预付预留实例 $426.612 x 2 / 12 个月 = $71.1/月
- EBS 成本 = 0.1 GB/月 x 8 GB x 2 = $1.6/月
- 弹性负载均衡器成本 = 每 ALB 小时 $0.0225 x 720 小时/月 = $16.2/月

**每月总费用** = 71.1 美元 EC2 成本 + 1.6 美元 EBS 成本 + 16.2 美元弹性负载均衡器成本 = **88.9 美元**

### 告警

如果通过日志通部署并创建了[告警](../domains/alarms.md)，可参考[CloudWatch 价格](https://aws.amazon.com/cloudwatch/pricing/)。


## 查看主堆栈和日志管道费用

**激活用户定义的成本分配标签**

为了让标签出现在您的账单报告上，您必须激活它们。 您的用户定义的成本分配标签代表您在 Billing and Cost Management 控制台中激活的标签键。 一旦激活或停用标签键，它将影响共享同一标签键的所有标签值。 一个标签键可以有多个标签值。 有关更多信息，请参阅 [AWS Billing and Cost Management API 参考](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_UpdateCostAllocationTagsStatus.html)。

### 激活您的标签

1. 登录 AWS 管理控制台并打开 [AWS 账单和成本管理控制台](https://console.aws.amazon.com/billing/)。
2. 在导航窗格中，选择**成本分配标签**。
3. 选择标签键 **CLOSolutionCostAnalysis** 进行激活。
4. 选择激活。

!!! Note "注意"

     创建用户定义标签并将其应用到资源后，标签最多可能需要 24 小时才会显示在成本分配标签页面上以供激活。


有关标签如何与成本分配标签一起显示在账单报告中的示例，请参阅[查看成本分配报告](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/configurecostallocreport.html#allocation-viewing)。



### 查看成本浏览器仪表板

1. 登录 AWS 管理控制台并打开 [AWS 账单和成本管理控制台](https://console.aws.amazon.com/billing/)。
2. 在导航窗格中，选择“**Cost Explorer**”。
3. 选择 **Tag** 作为显示的维度，然后选择特定标签 **CLOSolutionCostAnalysis** 进行过滤。
4. 如果下拉列表中没有您激活的标签，这是因为激活过程仍在进行中。 标签最长可能需要 24 小时才能激活。 稍后再试。

![costexplorerdashboard](../../images/cost-explorer-dashboard.png)
