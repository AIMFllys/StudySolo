# 智谱 AI (Zhipu / GLM) 兼容接入指南

> 📅 更新日期：2026-02-26  
> 🔗 对应路由链：**F 深度搜索首选** · **I 专业 OCR 首选**

## 一、 最新官方配置 (2026)

- **Chat Base URL**: `https://open.bigmodel.cn/api/paas/v4/chat/completions` (OpenAI 兼容路径为 `https://open.bigmodel.cn/api/paas/v4`)
- **Web Search Base URL**: 单独的工具接口或 Agent 接口
- **官方文档**: [https://bigmodel.cn/dev/howuse/introduction](https://bigmodel.cn/dev/howuse/introduction)

## 二、 2026 官方可选核心模型

智谱在多模态理解与原生网络架构上走得很超前，推出了专用的极致性价比模型 `glm-ocr`。

| 模型名称 | 在本项目的应用场景 | 特点与数据 |
| :--- | :--- | :--- |
| `glm-4-plus` | 对话/任务分流 | 高性能通用大模型。 |
| `glm-4-flash` | - | 极速便宜（本平台由百炼替换职能）。 |
| `web-search-pro` | **(主力)** 路由链 F 深度搜索 | 调用智谱原生的网络大脑搜索，提取多页面、跨时空聚合信息。 |
| `glm-ocr` | **(主力)** 路由链 I 专业 OCR | 2026初封神之作！专用的 0.9B 多模态轻量级 OCR 大模型，对于合并单元格、多级表头直接输出高质量 Markdown/HTML，价格低至 0.2元/百万 tokens。 |

## 三、 与 StudySolo 规划的映射

智谱在本项目中不是作为常规的聊天模型，而是承担了**两项无可取代的专业任务**：深度调研节点的原生 Web Agent 以及复杂版面解析节点的 OCR 核心引擎。

**配置环境变量**：
```env
ZHIPU_API_KEY=your-zhipu-key
```

## 四、 项目中如何调用的代码示例

### 1. 调用专业 GLM-OCR 的代码

在 `backend/app/services/ocr/` 中，针对视觉文档节点的数据转换：

```python
from openai import AsyncOpenAI
import os
import base64

async def call_zhipu_glm_ocr(image_path: str):
    """
    使用智谱最新的 glm-ocr 提取文档图片
    """
    client = AsyncOpenAI(
        api_key=os.getenv("ZHIPU_API_KEY"),
        base_url="https://open.bigmodel.cn/api/paas/v4"
    )

    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

    response = await client.chat.completions.create(
        model="glm-ocr",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请将图片内容完全转换为 Markdown 格式，保持复杂的表格排版结构不变。"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_string}"
                        }
                    }
                ]
            }
        ],
        stream=False # OCR类结构提取一般用同步结果
    )
    return response.choices[0].message.content
```

### 2. 深度网络搜索使用说明
深搜接口可能需要通过智谱的专有 Tool 调用或者特殊 model 形容词来触发 web 插件支持，本项目统一由路由代理。
```python
# 结合 tools 
response = await client.chat.completions.create(
    model="glm-4-plus",
    messages=[{"role": "user", "content": "请做一份未来十年生物医药趋势报告"}],
    tools=[{"type": "web_search", "web_search": {"enable": True}}]
)
```
