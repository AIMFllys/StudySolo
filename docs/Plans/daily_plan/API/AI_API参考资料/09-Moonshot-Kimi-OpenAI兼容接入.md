# 月之暗面 (Moonshot / Kimi) 兼容接入指南

> 📅 更新日期：2026-02-26  
> 🔗 对应路由链：**C 超长文本首选**

## 一、 最新官方配置 (2026)

- **Base URL**: `https://api.moonshot.cn/v1`
- **官方文档**: [https://platform.moonshot.cn/docs](https://platform.moonshot.cn/docs)

## 二、 2026 官方可选核心模型

2026 初，月之暗面发布了 Kimi K2.5 等原生多模态、超融合新模型，强化了超长文本的不掉线属性。

| 模型名称 | Context 长度 | 在本项目的应用场景 |
| :--- | :--- | :--- |
| `moonshot-v1-8k` | 8K | 一般短文本闲聊（暂不用于工作流主干）。 |
| `moonshot-v1-32k` | 32K | 处理普通研报、论文解析。 |
| `moonshot-v1-128k` | 128K | 中长文本。 |
| `kimi-k2.5` | 256K | **(主力)** 路由链 C 首选。无敌的长文本注意力机制，用于最后阶段的长文润色缝合 (`merge_polish`)。 |

## 三、 与 StudySolo 规划的映射

在我们的项目中，**润色合并节点 (`merge_polish`)** 需要把前面多个子节点生成的庞大 Markdown 碎片进行全局梳理和聚合，文本长度通常轻易突破几万 Token。Kimi 凭借着国内顶尖的长文本能力担当此任。

**配置环境变量**：
```env
MOONSHOT_API_KEY=sk-xxxxxxx
```

## 四、 项目中如何调用的代码示例

通过配置中心化方式，`ai_router.py` 会读取 `config.yaml` 拿到 Moonshot 配置。

```python
from openai import AsyncOpenAI
import os

async def call_moonshot_for_merge(fragments: list, global_context: str):
    """
    项目中调用 Kimi K2.5 进行长文缝合的示范
    """
    client = AsyncOpenAI(
        api_key=os.getenv("MOONSHOT_API_KEY"),
        base_url="https://api.moonshot.cn/v1"
    )

    # 1. 把所有碎片文本合并到 User Prompt 尾部
    raw_content = "\n\n---\n\n".join(fragments)
    system_prompt = f"你是一位资深编辑。请融合以下文本，遵守全局风格：\n{global_context}"
    user_prompt = f"这是所有分散的章节文本，请你进行无缝润色合并，输出完整的长文：\n{raw_content}"

    # 2. 流式调取 Kimi
    response = await client.chat.completions.create(
        model="kimi-k2.5", # 2026 最新主打
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3, # 润色环节必须降低创造性，保持原文事实
        stream=True
    )

    async for chunk in response:
        if chunk.choices[0].delta.content:
            yield {"type": "node_token", "token": chunk.choices[0].delta.content}
```
