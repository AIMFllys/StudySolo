# DeepSeek 官方 API 兼容接入指南

> 📅 更新日期：2026-02-26  
> 🔗 对应路由链：**B 深度推理首选**

## 一、 最新官方配置 (2026)

- **Base URL**: `https://api.deepseek.com/v1` 
- **官方文档**: [https://platform.deepseek.com/api-docs](https://platform.deepseek.com/api-docs)

## 二、 2026 官方可选核心模型

DeepSeek 在 2026 年大幅强化了其推理能力及 API 产品矩阵，支持了超大并发、上下文缓存。

| 模型名称 | Context 长度 | 在本项目的应用场景 |
| :--- | :--- | :--- |
| `deepseek-chat` | 128K | **(备选)** 格式严格要求不高时的通用常识输出。 |
| `deepseek-reasoner` | 128K | **(主力)** 路由链 B 首选。具备强大的 CoT (Chain-of-Thought) 思维链推理能力，用于大纲生成 (`outline_gen`) 和知识提炼 (`content_extract`)。 |
| `deepseek-v4` | 256K | **(前瞻)** 2026 新一代架构，长上下文可靠性极高。项目预留支持。 |

## 三、 与 StudySolo 规划的映射

在我们的八大平台双层架构中，DeepSeek 是**最核心的深度推理算力层**，负责所有需要“慢思考”的工作流节点。

**配置环境变量**：
```env
DEEPSEEK_API_KEY=sk-xxxxxxx
```

## 四、 项目中如何调用的代码示例

在 `backend/app/services/ai_router.py` 中，所有原生平台统一使用 `openai` SDK 兼容调用。对于 `deepseek-reasoner`（R1类模型），其特有的 `reasoning_content` 会优先保留给前端展示思维链：

```python
from openai import AsyncOpenAI
import os
import json

async def call_deepseek_reasoner(messages: list):
    """
    项目中调用 DeepSeek 进行大纲生成或深度提炼的示范
    """
    client = AsyncOpenAI(
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com/v1"
    )

    # 发起 SSE 流式请求
    response = await client.chat.completions.create(
        model="deepseek-reasoner",
        messages=messages,
        stream=True,
        # 注意：使用 reasoner 时不建议强行配置 temperature=0，保持默认或较高值以激发其推理树
    )
    
    async for chunk in response:
        delta = chunk.choices[0].delta
        
        # 1. 提取思维链 (CoT) 输出（如果有）
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
            yield json.dumps({"type": "node_reasoning", "token": delta.reasoning_content})
            
        # 2. 提取最终确定性内容
        if delta.content:
            yield json.dumps({"type": "node_token", "token": delta.content})
```
