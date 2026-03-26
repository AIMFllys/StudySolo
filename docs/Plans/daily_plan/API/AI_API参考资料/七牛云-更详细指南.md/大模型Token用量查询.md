大模型Token用量查询
最近更新时间: 2026-02-02 18:17:45

接口概述
/v2/stat/usage 接口是一个合并数据接口，支持以多种鉴权方式查询当前用户的大模型Token用量数据。

接口信息
接口路径: GET /v2/stat/usage
接口描述: 查询用户用量数据，支持天粒度和小时粒度查询每一个模型用量
鉴权方式: 支持用OAuth2.0规范的无状态API Key、或用当前账号的AK/SK签名来鉴权
数据返回:
采用API Key鉴权时，返回当前Key的Token用量。
采用AK/SK签名时（即管理员模式），返回当前UID下所有Key的Token总用量。
请求频率限制: 同一 IP 每秒可请求 5 次
接入端点: https://api.qnaigc.com
请求参数
Query 参数
参数名	类型	必填	描述	示例值
granularity	string	是	时间粒度，支持 day（天）或 hour（小时）	day
start	string	是	开始时间，RFC3339 格式	2024-01-01T00:00:00+08:00
end	string	是	结束时间，RFC3339 格式	2024-01-31T23:59:59+08:00
api_key	string	否	API Key（某些鉴权方式下需要）	sk-xxx
时间格式说明
标准格式: RFC3339 格式，如 2024-01-01T10:30:00+08:00
兼容格式: 对于 AK/SK 鉴权，也支持 YYYY-MM-DD 格式
时间范围限制
天粒度查询: 时间范围不能超过 1 个月（31 天）
小时粒度查询: 时间范围不能超过 7 天
鉴权方式
1. API Key 鉴权
在请求头中添加：

Authorization: Bearer sk-xxxxxxxxxxxxxxxxx
说明:

Token 必须以 sk- 开头
仅返回当前 API Key 下的用量信息
2. AK/SK 鉴权
使用七牛云标准的 AK/SK 鉴权方式，签名实现请参考底部示例：

Authorization: Qiniu <AccessKey>:<EncodedSign>
说明:

需要按照七牛云鉴权规范构造签名
返回该账号下的全部用量信息
支持传统的日期格式参数
响应格式
成功响应
{
  "status": true,
  "data": [
    {
      "id": "model_name",
      "name": "模型显示名称",
      "items": [
        {
          "name": "输入 Token",
          "unit": "kToken",
          "total": 1000,
          "categories": [
            {
              "name": "输入 Token",
              "values": [
                {
                  "time": "2024-01-01T00:00:00Z",
                  "value": 100
                },
                {
                  "time": "2024-01-02T00:00:00Z",
                  "value": 150
                }
              ]
            }
          ]
        },
        {
          "name": "输出 Token",
          "unit": "kToken",
          "total": 500,
          "categories": [
            {
              "name": "输出 Token",
              "values": [
                {
                  "time": "2024-01-01T00:00:00Z",
                  "value": 50
                },
                {
                  "time": "2024-01-02T00:00:00Z",
                  "value": 75
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
响应字段说明
字段	类型	描述
status	boolean	请求状态，true 表示成功
data	array	用量数据列表
data[].id	string	模型标识符
data[].name	string	模型显示名称
data[].items	array	计费项列表
data[].items[].name	string	计费项名称
data[].items[].unit	string	计费单位
data[].items[].total	number	总量
data[].items[].categories	array	分类数据
data[].items[].categories[].name	string	分类名称
data[].items[].categories[].values	array	时间序列数据
data[].items[].categories[].values[].time	string	时间点
data[].items[].categories[].values[].value	number	用量值
错误响应
{
  "status": false,
  "error": "错误信息描述"
}
错误码说明
HTTP 状态码	错误类型	描述
400	Bad Request	请求参数错误
401	Unauthorized	鉴权失败
500	Internal Server Error	服务器内部错误
常见错误信息
"start parameter parse error": 开始时间格式错误
"end parameter parse error": 结束时间格式错误
"end must be after start": 结束时间必须晚于开始时间
"当 granularity=day 时，时间范围不能超过 1 个月（31 天）": 天粒度查询时间范围超限
"当 granularity=hour 时，时间范围不能超过 7 天": 小时粒度查询时间范围超限
"invalid ak/sk sign": AK/SK 签名验证失败
"invalid api key": API Key 无效
使用示例
示例 1: API key 查询天粒度数据
curl -X GET "https://api.qnaigc.com/v2/stat/usage?granularity=day&start=2024-01-01T00:00:00%2B08:00&end=2024-01-31T23:59:59%2B08:00" \
  -H "Authorization: Bearer sk-xxxxxxxxxxxxxxxxx"
示例 2: AK/SK 查询小时粒度数据
curl -X GET "https://api.qnaigc.com/v2/stat/usage?granularity=hour&start=2024-01-01T00:00:00%2B08:00&end=2024-01-07T23:59:59%2B08:00" \
  -H "Authorization: Qiniu <AccessKey>:<EncodedSign>"
AK/SK 签名实现参考
const crypto = require('crypto')
/**
 * URL 安全的 Base64 编码
 * @param {Buffer} buffer - 要编码的数据
 * @returns {string} - URL 安全的 Base64 字符串
 */
function urlSafeBase64Encode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
/**
 * 生成待签名的原始字符串
 * @param {Object} options - 请求参数
 * @param {string} options.method - HTTP 方法（大小写敏感）
 * @param {string} options.path - 请求路径
 * @param {string} [options.query] - 查询参数（不包含 ?）
 * @param {string} options.host - 主机名
 * @param {string} [options.contentType] - Content-Type
 * @param {Object} [options.headers] - X-Qiniu-* 开头的自定义头（可选）
 * @param {string} [options.body] - 请求体（可选）
 * @returns {string} - 待签名的字符串
 */
function generateSigningString(options) {
  const { method, path, query, host, contentType, headers, body } = options
  // 1. Method + 空格 + Path
  let signingStr = method.toUpperCase()
  // 2. 添加 Path 和 Query
  signingStr += ' ' + path
  if (query) {
    signingStr += '?' + query
  }
  // 3. 添加 Host
  signingStr += '\nHost: ' + host
  // 4. 添加 Content-Type（如果有）
  if (contentType) {
    signingStr += '\nContent-Type: ' + contentType
  }
  // 5. 添加 X-Qiniu-* 头部（如果有）
  if (headers) {
    // 按 key 的 ASCII 排序
    const sortedKeys = Object.keys(headers).sort()
    sortedKeys.forEach(key => {
      if (key.toLowerCase().startsWith('x-qiniu-')) {
        // 格式化 key：首字母和 - 后的字母大写，其余小写
        const formattedKey = key.split('-')
          .map((part, index) => {
            if (index === 0) {
              return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            }
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          })
          .join('-')
        signingStr += '\n' + formattedKey + ': ' + headers[key]
      }
    })
  }
  // 6. 添加两个连续换行符
  signingStr += '\n\n'
  // 7. 添加 Body（如果有且 Content-Type 不是 application/octet-stream）
  if (body && contentType && contentType !== 'application/octet-stream') {
    signingStr += body
  }
  return signingStr
}
/**
 * 生成七牛云管理凭证（Access Token）
 * @param {string} accessKey - 七牛云 AccessKey
 * @param {string} secretKey - 七牛云 SecretKey
 * @param {Object} requestOptions - 请求参数（同 generateSigningString）
 * @returns {string} - 管理凭证字符串
 */
function generateAccessToken(accessKey, secretKey, requestOptions) {
  // 1. 生成待签名的原始字符串
  const signingStr = generateSigningString(requestOptions);
  
  // 2. 使用 HMAC-SHA1 计算签名
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(signingStr);
  const sign = hmac.digest();
  
  // 3. 对签名进行 URL 安全的 Base64 编码
  const encodedSign = urlSafeBase64Encode(sign);
  
  // 4. 将 AccessKey 和 encodedSign 用冒号连接
  const accessToken = accessKey + ':' + encodedSign;
  
  return accessToken;
}
// 示例用法
const accessKey = '你的 AK'
const secretKey = '你的 SK'
const requestOptions = {
  method: 'GET',
  path: '/v2/stat/usage?granularity=day&start=2025-10-01T00:00:00%2B08:00&end=2025-10-31T23:59:59%2B08:00',
  host: 'api.qnaigc.com',
  contentType: '',
  body: ''
}
const accessToken = generateAccessToken(accessKey, secretKey, requestOptions)
console.log('生成的 Access Token:', accessToken)
注意事项
时区处理: 建议使用 +08:00 时区，避免时区转换问题
数据延迟: 当天数据可能有延迟，建议查询昨天及之前的数据
数据聚合: 系统会自动聚合同一模型不同渠道的用量数据
缓存机制: 历史数据会被缓存，提高查询性能
限流保护: 接口有频率限制，请合理控制请求频率