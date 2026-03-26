批量任务推理 API 接入说明🚆
最近更新时间: 2025-10-28 17:54:54

批量推理 API 提供高效异步的批量数据处理能力，支持大规模并行推理任务，适用于离线计算、大数据分析等场景。

API 接入点
七牛云推理 API 接入域名：

https://api.qnaigc.com/v1
创建批量推理任务接口文档
获取接口密钥
如何获取七牛云 AI API Key
接口概览
创建批量推理任务，支持通过文件 URL 进行批量数据处理。

接口详情
基本信息
🚆

接口路径: /batchjob/inference
请求方法: POST
认证方式: Bearer Token
请求头
Authorization: Bearer <七牛云 AI API Key>
Content-Type: application/json
请求参数
参数名	类型	必填	说明	限制
name	string	是	任务名称	最大长度100
model	string	是	使用的模型名称	目前支持 deepseek-v3、deepseek-r1、deepseek-r1-32b 这三种模型
description	string	否	任务描述	最大长度255
input_files_url	string	是	输入文件的URL地址	最大长度1000
请求示例
{
  "name": "测试批量任务",
  "model": "deepseek-v3",
  "description": "这是一个批量处理测试任务",
  "input_files_url": "https://example.com/input.jsonl"
}
响应参数
参数名	类型	说明
id	string	任务ID，格式：bat-YYYYMMDDHHmmss-xxx
响应示例
{
  "id": "bat-20240315123456-abc123def456"
}
错误响应
{
  "error": {
    "message": "错误信息描述",
    "type": "错误类型"
  }
}
错误类型说明
错误类型	说明
authentication_error	认证错误
invalid_request_error	请求参数无效
invalid_model_error	不支持的模型
file_processing_failed	文件处理失败
create_batch_job_failed	创建批量任务失败
调用示例
CURL 方式
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl -X POST "$OPENAI_BASE_URL/batchjob/inference" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试批量任务",
    "model": "deepseek-v3",
    "description": "这是一个批量处理测试任务",
    "input_files_url": "https://example.com/input.jsonl"
  }'
补充说明
输入文件要求
文件格式：JSONL（JSON Lines）
每行格式：独立的JSON对象
访问要求：URL需可公开访问
文件大小限制：单个文件大小不超过100MB
custom_id 字段为必填，用于标识每个请求的唯一ID，每行必须包含一个唯一 custom_id 值
输入文件实例：

{"custom_id": "your-custom-request-1", "body": {"messages": [{"role": "user", "content": "什么是大语言模型？"}],"max_tokens": 1000,"top_p":1}}
{"custom_id": "your-custom-request-2", "body": {"messages": [{"role": "system", "content": "You are an helpful assistant."},{"role": "user", "content": "大海有多大？"}],"max_tokens": 1000}}
注意事项
输入文件必须是可公开访问的 URL
文件大小和格式需符合系统要求
模型名称必须是系统支持的型号
任务创建后会自动进入队列等待处理
可以通过任务 ID 查询任务状态和结果
列表批量推理任务接口文档
获取用户创建的批量推理任务列表，支持分页查询。

接口详情
基本信息
接口路径: /batchjob/inferences
请求方法: GET
认证方式: Bearer Token
请求头
Authorization: Bearer <七牛云 AI API Key>
请求参数
参数名	类型	必填	说明	限制
page	integer	否	页码	最小值为1，默认为1
page_size	integer	否	每页记录数	最小值为1，最大值为100，默认为100
响应参数
返回批量推理任务列表，每个任务包含以下字段：

参数名	类型	说明
id	string	任务ID，格式：bat-YYYYMMDDHHmmss-xxx
name	string	任务名称
model	string	使用的模型名称
description	string	任务描述
input_files_url	string	输入文件的URL地址
output_files_url	string	输出文件的URL地址（任务完成后可用），有效期7天
status	string	任务状态
status_message	string	状态描述信息
created_at	string	创建时间，ISO 8601格式
updated_at	string	更新时间，ISO 8601格式
响应示例
[
  {
    "id": "bat-20240315123456-abc123def456",
    "name": "测试批量任务",
    "model": "deepseek-v3",
    "description": "这是一个批量处理测试任务",
    "input_files_url": "https://example.com/input.jsonl",
    "output_files_url": "https://aitoken.qnaigc.com/xxx/output/bat-20250416171124-a215c5a0dec224757e8d429cd31d2a90.jsonl?e=1745400268&token=xxx",
    "status": "Completed",
    "status_message": "任务已完成",
    "created_at": "2025-04-18T11:37:09+08:00",
    "updated_at": "2025-04-18T11:37:09+08:00"
  },
  {
    "id": "bat-20240316123456-def456ghi789",
    "name": "另一个批量任务",
    "model": "deepseek-r1",
    "description": "这是另一个批量处理任务",
    "input_files_url": "https://example.com/input2.jsonl",
    "output_files_url": "",
    "status": "Running",
    "status_message": "任务正在运行中",
    "created_at": "2025-04-19T11:37:09+08:00",
    "updated_at": "2025-04-19T11:37:09+08:00"
  }
]
错误响应
{
  "error": {
    "message": "错误信息描述",
    "type": "错误类型"
  }
}
错误类型说明
错误类型	说明
authentication_error	认证错误
invalid_request_error	请求参数无效
list_batch_inference_job_failed	获取批量任务列表失败
调用示例
CURL 方式
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl -X GET "$OPENAI_BASE_URL/batchjob/inference?page=1&page_size=10" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
补充说明
任务状态(status)可能的值包括：

Queued: 排队中
Running: 运行中
Completed: 已完成
Failed: 失败
Terminating: 正在终止
Terminated: 已终止
只有当任务状态为Completed时，output_files_url才会有值

output_files_url 通过七牛对象存储和 CDN 提供对外访问地址，不要外传，有效期7天

查询批量推理任务详情接口文档
接口概览
获取指定批量推理任务的详细信息，包括任务状态、输入输出文件等。

接口详情
基本信息
接口路径: /batchjob/inference/{id}
请求方法: GET
认证方式: Bearer Token
请求头
Authorization: Bearer <七牛云 AI API Key>
路径参数
参数名	类型	必填	说明
id	string	是	批量任务ID，格式：bat-YYYYMMDDHHmmss-xxx
响应参数
参数名	类型	说明
id	string	任务ID，格式：bat-YYYYMMDDHHmmss-xxx
name	string	任务名称
model	string	使用的模型名称
description	string	任务描述
input_files_url	string	输入文件的URL地址
output_files_url	string	输出文件的URL地址（任务完成后可用），有效期7天
status	string	任务状态
status_message	string	状态描述信息
created_at	string	任务创建时间
updated_at	string	任务更新时间
响应示例
{
  "id": "bat-20240315123456-abc123def456",
  "name": "测试批量任务",
  "model": "deepseek-v3",
  "description": "这是一个批量处理测试任务",
  "input_files_url": "https://example.com/input.jsonl",
  "output_files_url": "https://aitoken.qnaigc.com/xxx/output/bat-20250416171124-a215c5a0dec224757e8d429cd31d2a90.jsonl?e=1745400268&token=xxx",
  "status": "Completed",
  "status_message": "任务已完成",
  "created_at": "2025-04-18T11:37:09+08:00",
  "updated_at": "2025-04-18T11:37:09+08:00"
}
错误响应
{
  "error": {
    "message": "错误信息描述",
    "type": "错误类型"
  }
}
错误类型说明
错误类型	说明
authentication_error	认证错误
view_batch_inference_job_failed	查询批量任务失败
调用示例
CURL 方式
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl -X GET "$OPENAI_BASE_URL/batchjob/inference/bat-20240315123456-abc123def456" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
任务状态说明
状态值	说明
Queued	任务已提交，等待处理
Running	任务正在运行中
Completed	任务已完成
Failed	任务执行失败
Terminating	任务正在终止中
Terminated	任务已终止
删除批量推理任务接口文档
接口概览
删除指定的批量推理任务，任务将被标记为已删除并停止处理。

接口详情
基本信息
接口路径: /batchjob/inference/{id}
请求方法: DELETE
认证方式: Bearer Token
请求头
Authorization: Bearer <七牛云 AI API Key>
路径参数
参数名	类型	必填	说明
id	string	是	批量任务ID，格式：bat-YYYYMMDDHHmmss-xxx
响应参数
参数名	类型	说明
message	string	操作结果信息
响应示例
{
  "message": "delete_batch_inference_job_success"
}
错误响应
{
  "error": {
    "message": "错误信息描述",
    "type": "错误类型"
  }
}
错误类型说明
错误类型	说明
authentication_error	认证错误
delete_batch_inference_job_failed	删除批量任务失败
delete_batch_inference_job_db_failed	数据库操作失败
调用示例
CURL 方式
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl -X DELETE "$OPENAI_BASE_URL/batchjob/inference/bat-20240315123456-abc123def456" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
补充说明
已删除的任务无法恢复
停止批量推理任务接口文档
接口概览
停止正在运行的批量推理任务。

接口详情
基本信息
接口路径: /batchjob/inference/stop/{id}
请求方法: POST
认证方式: Bearer Token
请求头
Authorization: Bearer <七牛云 AI API Key>
Content-Type: application/json
路径参数
参数名	类型	必填	说明
id	string	是	批量任务ID，格式：bat-YYYYMMDDHHmmss-xxx
响应
成功停止任务时，返回HTTP状态码204（No Content），无响应体。

错误响应
{
  "error": {
    "message": "错误信息描述",
    "type": "错误类型"
  }
}
错误类型说明
错误类型	说明
authentication_error	认证错误
stop_batch_inference_job_failed	停止批量任务失败
stop_batch_inference_job_db_failed	更新数据库状态失败
调用示例
CURL 方式
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl -X POST "$OPENAI_BASE_URL/batchjob/inference/stop/bat-20240315123456-abc123def456" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
补充说明
任务状态限制
只有处于运行中（Running）或排队中（Queued）状态的任务可以被停止
已经处于终止中（Terminating）、已终止（Terminated）或失败（Failed）状态的任务无法停止
停止任务后，任务状态将变为已终止（Terminated）
已停止的任务可以通过恢复接口重新启动
重启批量推理任务接口文档
接口概览
重启已停止或失败的批量推理任务，使其恢复执行。

接口详情
基本信息
接口路径: /batchjob/inference/resume/{id}
请求方法: POST
认证方式: Bearer Token
请求头
Authorization: Bearer <七牛云 AI API Key>
Content-Type: application/json
路径参数
参数名	类型	必填	说明
id	string	是	批量任务ID，格式：bat-YYYYMMDDHHmmss-xxx
响应
成功重启任务时，服务器返回 HTTP 204 No Content 状态码，无响应体。

错误响应
{
  "error": {
    "message": "错误信息描述",
    "type": "错误类型"
  }
}
错误类型说明
错误类型	说明
authentication_error	认证错误
resume_batch_inference_job_failed	重启批量任务失败
resume_batch_inference_job_db_failed	数据库操作失败
调用示例
CURL 方式
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl -X POST "$OPENAI_BASE_URL/batchjob/inference/resume/bat-20240315123456-abc123def456" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json"
补充说明
使用限制
只能重启已停止或失败的任务
正在运行或已完成的任务无法重启
任务重启后会重新进入任务队列等待处理