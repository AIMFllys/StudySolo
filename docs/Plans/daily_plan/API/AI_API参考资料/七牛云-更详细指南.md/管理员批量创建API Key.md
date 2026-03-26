管理员批量创建API Key
最近更新时间: 2025-12-22 22:07:59

APIKey 批量创建接口
Base URL: https://api.qnaigc.com

概述
本接口用于管理员账号批量创建大模型API Key（密钥），适用于需要一次性生成多个访问密钥的场景。接口采用 管理员AK/SK 签名认证机制，请求时需要按照签名规范生成数字签名。

认证方式
使用七牛云账号的 管理员AK/SK 签名认证。
签名实现请参考底部示例：

Authorization: Qiniu <AccessKey>:<EncodedSign>
接口详情
POST /v1/apikeys
批量创建 APIKey。

请求头：

名称	类型	必填	描述
Authorization	string	是	AK/SK 签名，格式为 Authorization: Qiniu <AccessKey>:<EncodedSign>
请求体示例：

{
  "count": 2,
  "names": ["测试key1", "测试key2"]
}
参数说明：

字段	类型	必填	说明
count	integer	是	需要创建的 APIKey 数量。注意： 账户内已有 APIKey 数量加上本次创建数量总和不得超过 100。
names	string[]	是	APIKey 名称列表，长度必须与 count 一致。
响应示例（200 OK）

{
  "status": true,
  "data": {
    "keys": [
      {
        "key": "sk-xxx",
        "name": "测试key1",
        "createdAt": "2025-11-20T19:56:02+08:00",
        "enabled": true
      },
      {
        "key": "sk-yyy",
        "name": "测试key2",
        "createdAt": "2025-11-20T19:56:02+08:00",
        "enabled": true
      }
    ]
  }
}
响应字段说明：

字段	类型	说明
status	boolean	请求状态，true 表示成功
data.keys	array	创建的 APIKey 列表
data.keys[].key	string	APIKey 值（以 sk- 开头）
data.keys[].name	string	APIKey 名称
data.keys[].createdAt	string	创建时间（ISO 8601 格式）
data.keys[].enabled	boolean	是否启用
错误状态码

状态码	说明
400	请求参数错误（如 names 长度与 count 不匹配）
401	认证失败（签名无效或过期）
403	权限不足或 APIKey 总数超限
500	服务器内部错误
代码示例
基于 AK/SK 签名创建key
curl --location "https://api.qnaigc.com/v1/apikeys" \
  --header "Content-Type: application/json" \
  --header "Authorization: Qiniu <AccessKey>:<EncodedSign>" \
  --data '{
    "count": 2,
    "names": [
        "测试key1",
        "测试key2"
    ]
  }'
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
// 示例用法：批量创建 APIKey
const accessKey = '你的 AK'
const secretKey = '你的 SK'
// 准备请求体
const requestBody = {
  count: 2,
  names: ['测试key1', '测试key2']
}
const bodyString = JSON.stringify(requestBody)
// 构建签名参数
const requestOptions = {
  method: 'POST',
  path: '/v1/apikeys',
  host: 'api.qnaigc.com',
  contentType: 'application/json',
  body: bodyString
}
// 生成签名
const accessToken = generateAccessToken(accessKey, secretKey, requestOptions)
console.log('生成的 Access Token:', accessToken)
// 实际调用接口
const fetch = require('node-fetch') // 如果使用 Node.js
fetch('https://api.qnaigc.com/v1/apikeys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Qiniu ${accessToken}`
  },
  body: bodyString
})
  .then(res => res.json())
  .then(data => {
    console.log('批量创建成功:', data)
  })
  .catch(err => {
    console.error('请求失败:', err)
  })
注意事项
请妥善保管生成的 sk-xxx 密钥，避免泄露。
每个账户最多允许创建 100 个 APIKey，创建前请确认总数不超过限制。
签名有效期为 15 分钟，建议在请求前实时生成。
若需创建大量 APIKey，请分批调用本接口。