# OpenAI 统一 SDK 与 Responses 接口

## 官方文档（最新检索）

- OpenAI Python SDK（官方仓库）  
  https://github.com/openai/openai-python
- OpenAI API 文档（Libraries）  
  https://platform.openai.com/docs/libraries
- OpenAI Responses API Reference  
  https://platform.openai.com/docs/api-reference/responses/object

> 检索日期：2026-02-26

## 与 StudySolo 的关系

- 你当前规划是“单 SDK 统一调用多供应商 OpenAI 兼容接口”。
- `openai` SDK 可通过 `base_url` + `api_key` 切换到不同供应商。

## 最小调用示例（Python）

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="https://example-compatible-provider/v1"
)

resp = client.chat.completions.create(
    model="your-model",
    messages=[{"role": "user", "content": "你好"}],
    stream=False,
)

print(resp.choices[0].message.content)
```

## 迁移建议

- MVP 可优先用 `chat.completions`（兼容性最好）。
- 需要更强工具调用/会话状态时，逐步上 `responses` 接口。
