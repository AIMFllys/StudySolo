<!-- 编码：UTF-8 -->

# 多平台模型 API 接入与使用指南

> 📅 编写日期：2026-02-26  
> 📌 文档定位：开发帮助 · 详细指南  
> 🎯 目的：为开发者演示如何在 Python 环境中使用最新版 `openai` SDK 统一调用 StudySolo 所接入的四大平台（七牛云、优云智算、火山引擎、阿里云百炼）的兼容接口。

---

## 📑 目录

- [一、准备工作](#一准备工作)
- [二、七牛云 (QNAIGC) API 调用指南](#二七牛云-qnaigc-api-调用指南)
- [三、优云智算 (Compshare) API 调用指南](#三优云智算-compshare-api-调用指南)
- [四、火山引擎 (Volcengine) API 调用指南](#四火山引擎-volcengine-api-调用指南)
- [五、阿里云百炼 (DashScope) API 调用指南](#五阿里云百炼-dashscope-api-调用指南)
- [六、代码最佳实践（封装多平台）](#六代码最佳实践封装多平台)

---

## 一、准备工作

StudySolo 接入的以上四大平台**全部兼容 OpenAI 标准 API 协议**（`/v1/chat/completions`）。因此，我们只需要安装 OpenAI 官方 Python 分发包即可。

### 1. 安装依赖

```bash
pip install openai -U
```

### 2. 核心原理

不管调用哪家的 API，核心都是替换两个参数：
1. `api_key`：各平台颁发给你的认证密钥。
2. `base_url`：各平台的网关地址。

> 💡 **提示**：建议在 `.env` 文件中配置这些信息，而不是写死在代码中。

---

## 二、七牛云 (QNAIGC) API 调用指南

七牛云是一个算力聚合平台，用一个 Key 就可以调用 DeepSeek、豆包、通义千问、Kimi、GLM、GPT-4o、Claude 3.5 等 50+ 主流模型。新用户送 300 万 Token 免费额度。

### 2.1 基础信息

- **官网**: [https://qnaigc.com](https://qnaigc.com)
- **Base URL**: `https://api.qnaigc.com/v1`
- **代表模型**: `deepseek-r1`, `qwen3-turbo`, `doubao-2.0-pro` 等

### 2.2 Python 代码示例

```python
import os
from openai import OpenAI

# 初始化客户端，替换为七牛云参数
client = OpenAI(
    api_key=os.environ.get("QINIU_AI_API_KEY", "your-qiniu-api-key"),
    base_url="https://api.qnaigc.com/v1",
)

# 发送请求
response = client.chat.completions.create(
    model="deepseek-r1",  # 填入你想调用的具体模型名
    messages=[
        {"role": "system", "content": "你是一个有用的智能助手。"},
        {"role": "user", "content": "用Python写一个冒泡排序。"}
    ],
    temperature=0.7,
    max_tokens=2048
)

print(response.choices[0].message.content)
```

---

## 三、优云智算 (Compshare) API 调用指南

优云智算是 UCloud 旗下的 GPU 算力平台和模型聚合调用 API 平台。它是我们"天然异构容灾"的重要一环。

### 3.1 基础信息

- **官网**: [https://www.compshare.cn](https://www.compshare.cn)
- **Base URL**: `https://api.compshare.cn/v1`
- **代表模型**: `deepseek-r1`, `deepseek-v3`, `qwen-max` 等

### 3.2 Python 代码示例

```python
import os
from openai import OpenAI

# 初始化客户端，替换为优云智算参数
client = OpenAI(
    api_key=os.environ.get("COMPSHARE_API_KEY", "your-compshare-api-key"),
    base_url="https://api.compshare.cn/v1",
)

# 使用流式 (Stream) 方式获取输出
response = client.chat.completions.create(
    model="deepseek-v3", 
    messages=[
        {"role": "user", "content": "请分析一下当前人工智能的发展趋势。"}
    ],
    stream=True  # 开启流式打字机效果
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()
```

---

## 四、火山引擎 (Volcengine) API 调用指南

火山引擎是字节跳动的云服务，其提供的豆包模型系列具有极高的性价比，且含有 200万/日的免费额度。

### 4.1 基础信息

- **官网**: [https://console.volcengine.com/ark](https://console.volcengine.com/ark)
- **Base URL**: `https://ark.cn-beijing.volces.com/api/v3`
- **代表模型**: `doubao-2.0-pro`, `doubao-seed-1.6` 

### 4.2 Python 代码示例

> ⚠️ 注意：与其他平台直接传模型名称不同，早期火山引擎部分接口要求必须传对应的 **Endpoint ID** (通常以 `ep-` 开头)。但如果使用兼容 OpenAI 的 v3 URL，大部分也已支持传模型原始标识（具体可看控制台的接入说明）。

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("VOLCENGINE_API_KEY", "your-volcengine-api-key"),
    base_url="https://ark.cn-beijing.volces.com/api/v3",
)

response = client.chat.completions.create(
    model="doubao-2.0-pro",  # 或指定的接入点 ID (Endpoint ID)
    messages=[
        {"role": "user", "content": "给我讲一个程序员的冷笑话。"}
    ]
)

print(response.choices[0].message.content)
```

---

## 五、阿里云百炼 (DashScope) API 调用指南

阿里云百炼是通义千问 (Qwen) 系列的原生宿主，输出质量极高、延迟表现最优，非常适合承担复杂的工作流编排和长文处理。

### 5.1 基础信息

- **官网**: [https://bailian.aliyun.com](https://bailian.aliyun.com)
- **Base URL**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **代表模型**: `qwen3-turbo`, `qwen-max`, `qwen2.5-72b-instruct`

### 5.2 Python 代码示例

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("DASHSCOPE_API_KEY", "your-dashscope-api-key"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

response = client.chat.completions.create(
    model="qwen3-turbo", 
    messages=[
        {"role": "user", "content": "将这段话翻译成英文：你好世界。"}
    ]
)

print(response.choices[0].message.content)
```

---

## 六、代码最佳实践（封装多平台）

为了方便在你的后台任意调用这些提供商而不用每次重复写初始化代码，你可以封装一个生成器。

这也是 StudySolo 中 `ai_router.py` 的底层核心简化版原理：

```python
from openai import OpenAI
import os

def get_ai_client(provider: str) -> tuple[OpenAI, str]:
    """
    根据提供商名称返回初始化好的 OpenAI 客户端。
    支持: 'qiniu', 'compshare', 'volcengine', 'dashscope'
    """
    # 集中配置字典
    providers_config = {
        "qiniu": {
            "api_key": os.environ.get("QINIU_AI_API_KEY"),
            "base_url": "https://api.qnaigc.com/v1"
        },
        "compshare": {
            "api_key": os.environ.get("COMPSHARE_API_KEY"),
            "base_url": "https://api.compshare.cn/v1"
        },
        "volcengine": {
            "api_key": os.environ.get("VOLCENGINE_API_KEY"),
            "base_url": "https://ark.cn-beijing.volces.com/api/v3"
        },
        "dashscope": {
            "api_key": os.environ.get("DASHSCOPE_API_KEY"),
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
        }
    }
    
    if provider not in providers_config:
        raise ValueError(f"不支持的提供商: {provider}")
        
    config = providers_config[provider]
    
    # 构造客户端
    client = OpenAI(
        api_key=config["api_key"],
        base_url=config["base_url"]
    )
    
    return client

# ========= 试用封装 =========
if __name__ == "__main__":
    # 配置你的临时环境变量（生产环境不要写在代码里）
    os.environ["COMPSHARE_API_KEY"] = "sk-xxxxxxxx"
    
    # 获取优云智算客户端
    client = get_ai_client("compshare")
    
    res = client.chat.completions.create(
        model="deepseek-v3",
        messages=[{"role": "user", "content": "你好"}]
    )
    print("优云智算响应:", res.choices[0].message.content)
```
