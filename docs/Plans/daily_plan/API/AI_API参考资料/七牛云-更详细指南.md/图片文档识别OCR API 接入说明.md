图片文档识别OCR API 接入说明
最近更新时间: 2025-10-28 17:54:15

简介
本接口支持对图片和 PDF 文档进行高精度文字识别（OCR），具备超低延迟响应。识别结果可直接作为 AI 推理接口的输入文本，适用于多种智能应用场景。

功能特性
支持多种输入格式：图片（如 PNG、JPG 等）、PDF 文档。
高精度识别：精准提取图片或文档中的文字内容。
超低延迟：响应速度快，适合实时或批量处理需求。
易于集成：标准 RESTful API，便于与各类系统对接。
API 接入点
https://api.qnaigc.com/v1
API 调用方式
获取接口密钥
如何获取七牛云 AI API Key
1. 请求示例
使用 curl 命令调用 OCR 接口：

export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<你的七牛云 AI API KEY>"
curl --location "$OPENAI_BASE_URL/images/ocr" \
--header "Content-Type: application/json" \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--data '{
    "model":"ocr",
    "url":"https://static.qiniu.com/ai-inference/example-resources/ocr-example.png"
}'
参数说明
参数名	类型	必填	说明
model	string	是	固定为 “ocr”
url	string	是	需识别图片或 PDF 的公网链接
返回结果示例
{
  "id": "这是调用 id"
  "text": "这里是图片或PDF中识别出的文字内容"
}
字段名	类型	说明
text	string	识别出的全部文本内容
id	string	本次调用的 id
如何通过对象存储获取输入图片地址？
推荐使用七牛对象存储来存储文件并获取在线访问地址，提供给模型来进行识别和推理。

可以通过 curl 快速进行上传测试：

curl $你的空间区域上传地址 \
  -F "file=@你的文件路径" \
  -F "token=$你的上传 token" \
  -F "key=你的文件名" \
或者在代码中使用 python 来实现。

import requests
# 目标 URL
url = "空间区域上传地址"
# 文件字段
files = {
    "file": open("上传的文件地址", "rb")  # 以二进制模式打开文件
}
# 其他表单字段
data = {
    "key": "保存的文件名称",
    "token": "你的上传 token"
}
# 发送 POST 请求
response = requests.post(url, files=files, data=data)
# 输出响应
print("Status Code:", response.status_code)
print("Response Body:", response.text)
我们还提供了许多语言的上传 SDK，简单易用，欢迎查看我们的【SDK 中心】来了解。

更多对象存储信息欢迎参考对象存储的【产品使用文档】。