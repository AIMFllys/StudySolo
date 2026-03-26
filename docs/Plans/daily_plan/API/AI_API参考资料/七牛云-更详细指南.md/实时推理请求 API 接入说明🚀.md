实时推理请求 API 接入说明🚀
最近更新时间: 2025-12-29 17:41:19

七牛云AI大模型推理 API 是一个高性能、易集成的Token API (即MaaS服务)，支持50多款主流大模型。兼容OpenAI API和Anthropic API接口格式，方便您集成到各种业务和应用场景中。

Token API 接入点
🚀
七牛云AI大模型推理 API 接入域名：

https://api.qnaigc.com/v1
使用前提：获取API KEY（API 密钥）
支持接口列表
接口名	说明
/v1/chat/completions	对话型推理接口(兼容OpenAI格式)，支持图片文字识别、文件识别
图片格式：支持 JPG、JPEG、PNG、BMP、PDF 等常见格式，建议使用 JPG 格式
联网搜索：参考文档
/v1/models	列举所有可用模型ID及参数
/v1/messages	兼容Anthropic API格式，另参考Claude Code配置
获取可用模型列表
# 获取所有可用模型
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl "$OPENAI_BASE_URL/models" \
    -H "Authorization: Bearer $OPENAI_API_KEY"
或使用 Python：

from openai import OpenAI
client = OpenAI(
    base_url='https://api.qnaigc.com/v1',
    api_key='your qiniu_ai_api_key'
)
# 获取可用模型列表
models = client.models.list()
for model in models.data:
    print(f"模型ID: {model.id}")
HTTP 调用示例
使用上一步获取的 七牛云 API KEY 调用 chat 接口，支持的模型列表也可以通过我们的模型广场查看，例如：

# 调用推理 API
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl "$OPENAI_BASE_URL/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "messages": [{"role": "user", "content": "夸一夸七牛云 AI 推理服务"}],
        "model": "deepseek-v3",
        "stream": true
    }'
Python OpenAI 库调用示例
流式调用
from openai import OpenAI
openai_base_url = 'https://api.qnaigc.com/v1'
openai_api_key = 'your qiniu_ai_api_key'
client = OpenAI(
    base_url=openai_base_url,
    api_key=openai_api_key
)
# 发送带有流式输出的请求
content = ""
messages = [
    {"role": "user", "content": "夸一夸七牛云 AI 推理服务"}
]
response = client.chat.completions.create(
    model="deepseek-v3",
    messages=messages,
    stream=True,  # 启用流式输出
    max_tokens=4096
)
# 逐步接收并处理响应
for chunk in response:
    if chunk.choices[0].delta.content:
        content += chunk.choices[0].delta.content
print("第一轮回复:")
print(content)
# Round 2 - 继续对话
messages.append({"role": "assistant", "content": content})
messages.append({'role': 'user', 'content': "继续"})
response = client.chat.completions.create(
    model="deepseek-v3",
    messages=messages,
    stream=True
)
# 重置 content 变量来存储第二轮回复
second_content = ""
for chunk in response:
    if chunk.choices[0].delta.content:
        second_content += chunk.choices[0].delta.content
print("第二轮回复:")
print(second_content)
非流式调用
from openai import OpenAI
openai_base_url = 'https://api.qnaigc.com/v1'
openai_api_key = 'your qiniu_ai_api_key'
client = OpenAI(
    base_url=openai_base_url,
    api_key=openai_api_key
)
# 发送非流式输出的请求
messages = [
    {"role": "user", "content": "夸一夸七牛云 AI 推理服务"}
]
response = client.chat.completions.create(
    model="deepseek-v3",
    messages=messages,
    stream=False, 
    max_tokens=4096
)
content = response.choices[0].message.content
print("第一轮回复:")
print(content)
# Round 2 - 继续对话
messages.append({"role": "assistant", "content": content})
messages.append({'role': 'user', 'content': "继续"})
response = client.chat.completions.create(
    model="deepseek-v3",
    messages=messages,
    stream=False
)
second_content = response.choices[0].message.content
print("第二轮回复:")
print(second_content)
图像生成
要生成图像，请向 /v1/chat/completions 端点发送请求，并将 modalities 参数设置为同时包含 "image" 和 "text"。
示例代码如下：

    import requests
    import json
    url = "https://api.qnaigc.com/v1/chat/completions"
    headers = {
        "Authorization": "Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "{{MODEL}}",
        "messages": [
            {
                "role": "user",
                "content": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"
            }
        ],
        "modalities": ["image", "text"],
        "image_config": {
            "aspect_ratio": "16:9"
        }
    }
    response = requests.post(url, headers=headers, json=payload)
    result = response.json()
    if result.get("choices"):
        message = result["choices"][0]["message"]
        if message.get("images"):
            for image in message["images"]:
                image_url = image["image_url"]["url"]
                print(f"Generated image: {image_url[:50]}...")
宽高比
通过设置 image_config.aspect_ratio 来请求特定的宽高比。支持的宽高比：
1:1 → 1024×1024 (默认)
2:3 → 832×1248
3:2 → 1248×832
3:4 → 864×1184
4:3 → 1184×864
4:5 → 896×1152
5:4 → 1152×896
9:16 → 768×1344
16:9 → 1344×768
21:9 → 1536×672
响应格式
生成图像时，消息包含一个 images 字段，其中包含生成的图像：
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I've generated a beautiful sunset image for you.",
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
            }
          }
        ]
      }
    }
  ]
}
图像格式

格式：图像以 base64 编码的数据 URL 形式返回
类型：通常是 PNG 格式 (data:image/png;base64,)
多张图像：某些模型可以在单个响应中生成多张图像
尺寸：图像尺寸因模型能力而异
模型兼容性
并非所有模型都支持图像生成。目前只有gemini-2.5-flash-image支持。

最佳实践

清晰的提示：提供详细的描述以获得更好的图像质量
错误处理：在处理之前检查响应中是否存在 images 字段
速率限制：图像生成可能有与文本生成不同的速率限制
存储：考虑如何处理和存储 base64 图像数据
文件识别推理
API 已经支持文件内容识别推理，示例代码如下：

# 调用文件识别 API
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl --location "$OPENAI_BASE_URL/chat/completions" \
    --header "Content-Type: application/json" \
    --header "Authorization: Bearer $OPENAI_API_KEY" \
    --data '{
        "model": "deepseek-v3",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "pdf",
                        "file_url": {
                            "url": "https://aitoken-public.qnaigc.com/test/transformer.pdf"
                        }
                    },
                    {
                        "type": "text",
                        "text": "总结一下文档内容"
                    }
                ]
            }
        ]
    }'
参数：type 为文件格式，url 为文件地址
文件格式：目前仅支持 pdf、docx、xlsx、pptx 类型
注意：文件内容，仍受上下文长度限制(64K tokens)，所以需注意文件内容长度
推荐使用七牛对象存储来存储文件并获取在线访问地址，提供给模型来进行识别和推理。

图片文字识别推理
API 已经支持图片文字识别推理，同时接口依然兼容 OpenAI，示例代码如下：

# 调用图片识别 API
export OPENAI_BASE_URL="https://api.qnaigc.com/v1"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl "$OPENAI_BASE_URL/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "请帮我整理图片中的内容并整理一份报告给我"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://www.qiniu.com/qiniu_ai_token_snapshot.png"
                        }
                    }
                ]
            }
        ],
        "model": "deepseek-v3"
    }'
注意：image_url 指向的文件大小不能超过 8MB
文件格式：支持 JPG、JPEG、PNG、BMP、PDF 等常见格式，建议使用 JPG 格式
如何通过对象存储获取输入图片地址？
推荐使用七牛对象存储来存储文件并获取在线访问地址，提供给模型来进行识别和推理。

可以通过 curl 快速进行上传测试：

# 上传文件到七牛对象存储
curl "$你的空间区域上传地址" \
    -F "file=@$你的文件路径" \
    -F "token=$你的上传token" \
    -F "key=$你的文件名"
或者在代码中使用 Python 来实现：

import requests
# 上传文件到七牛对象存储
def upload_file_to_qiniu(file_path, upload_url, upload_token, file_key):
    """
    上传文件到七牛对象存储
    
    Args:
        file_path: 本地文件路径
        upload_url: 空间区域上传地址
        upload_token: 上传 token
        file_key: 保存的文件名称
    
    Returns:
        response: 上传响应结果
    """
    # 使用 with 语句确保文件正确关闭
    with open(file_path, "rb") as file:
        files = {
            "file": file
        }
        
        # 其他表单字段
        data = {
            "key": file_key,
            "token": upload_token
        }
        
        # 发送 POST 请求
        response = requests.post(upload_url, files=files, data=data)
    
    # 输出响应
    print("Status Code:", response.status_code)
    print("Response Body:", response.text)
    
    return response
# 使用示例
if __name__ == "__main__":
    upload_url = "你的空间区域上传地址"
    file_path = "上传的文件地址"
    upload_token = "你的上传token"
    file_key = "保存的文件名称"
    
    result = upload_file_to_qiniu(file_path, upload_url, upload_token, file_key)
我们还提供了许多语言的上传 SDK，简单易用，欢迎查看我们的【SDK 中心】来了解。

更多对象存储信息欢迎参考对象存储的【产品使用文档】。

参考文档
AI 大模型推理产品介绍
AI 大模型推理模型广场