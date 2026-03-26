# 优云智算（Compshare）OpenAI 兼容接入

## 官方资料（最新检索）

- 优云智算官网（模型 API 服务入口）
  https://www.compshare.cn
- 优云智算模型 API 文档（必看文档入口）
  https://www.compshare.cn/docs（登录后可见）
- 开发者示例代码（GitHub，含 Python/Go/Java SDK）
  https://github.com/ucloud/compshare-developer-examples/
- UCloud 官方 API 文档中心（UCompShare 索引）
  https://docs.ucloud.cn/api/ucompshare-api/index

> 检索日期：2026-02-26

## 与 StudySolo 规划的映射

- 在四平台路由中定位为 **🥈 第 2 优先**。
- 环境变量：
  - `COMPSHARE_API_KEY`（API Key 认证）
  - Base URL 固定为：`https://api.compshare.cn/v1`
- 角色定位：**异构算力容灾层** — UCloud 自有 GPU 集群，算力侧与字节（火山引擎）、阿里（百炼）完全独立，是天然的容灾备份。

## 接入关键点

1. **协议兼容性**：
   - 完全兼容 OpenAI `/v1/chat/completions`（含 stream=True）。
   - 同时声称兼容 Gemini 接口风格。
   - 直接使用 `openai` Python SDK，替换 `api_key` 和 `base_url` 即可。

2. **认证方式**：
   - 平台内部使用 `public_key` + `private_key` 体系。
   - 在 OpenAI 兼容模式下，只需一个 API Key 即可调用（类似 Bearer Token）。
   - 密钥在控制台 → API 管理处获取。

3. **模型标识**：
   - 模型名直接传原厂 ID，如 `deepseek-r1`、`deepseek-v3`、`qwen3-turbo`。
   - 无需 Endpoint ID。

4. **平台能力**：
   - **多模态覆盖**：语言 + 图像 + 视频 + 语音，全场景 API。
   - **双模式运营**：既卖 GPU 算力租赁，也卖模型 API 调用 — 对开发者来说 API 即用即付更方便。
   - **价格优势**：主打性价比，部分模型定价低于原厂。

5. **SSE 流式**：
   - 支持 `stream=True`，响应格式兼容 OpenAI 标准。
   - 与项目 SSE 链路（`sse-starlette` → Nginx → `EventSource`）完全兼容。

## 最小示例（OpenAI SDK 方式）

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-compshare-api-key",
    base_url="https://api.compshare.cn/v1",
)

# 非流式
resp = client.chat.completions.create(
    model="deepseek-v3",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)

# 流式
stream = client.chat.completions.create(
    model="deepseek-r1",
    messages=[{"role": "user", "content": "分析一下人工智能的发展趋势"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

## 异步调用示例（FastAPI 后端场景）

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="your-compshare-api-key",
    base_url="https://api.compshare.cn/v1",
)

async def call_compshare(prompt: str):
    """异步流式调用优云智算"""
    response = await client.chat.completions.create(
        model="qwen3-turbo",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    
    full_text = ""
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            full_text += delta
            yield delta  # SSE 逐 token 推送
    
    return full_text
```

## 可用模型矩阵（StudySolo 相关）

| 模型 | 模型 ID | 类型 | 与其他平台重叠 |
|------|---------|------|--------------|
| DeepSeek-R1 | `deepseek-r1` | 推理 | ✅ 七牛/火山 |
| DeepSeek-V3 | `deepseek-v3` | 通用 | ✅ 七牛/火山 |
| Qwen 系列 | `qwen3-turbo` 等 | 复杂 | ✅ 七牛/百炼 |
| Kimi | `kimi` | 长文 | ✅ 七牛 |
| GLM-4 | `glm-4` | 中文 | ✅ 七牛 |

## 更详细指南（本地参考）

> 💡 以下指南存储于 `./优云智算-更详细官方指南/` 目录下。

- [**可用模型与计费指南**](./优云智算-更详细官方指南/优云智算可用模型.md)：包含详细的模型倍率表、限流说明及计费公式。

> 注：优云智算的具体可用模型列表会动态更新，建议在控制台确认最新状态。

## 接入检查清单

1. ✅ 在优云智算控制台注册账号并完成实名认证。
2. ✅ 进入 API 管理页面，创建 API Key。
3. ✅ 将 API Key 写入后端 `.env` 文件的 `COMPSHARE_API_KEY` 字段。
4. ✅ 在 `config.yaml` 中确认 `compshare` 提供商的 `base_url` 和优先级。
5. ✅ 测试调用：`python -c "from openai import OpenAI; ..."` 验证连通性。

## 风险提示

- 优云智算作为 UCloud 子品牌，平台规模和文档成熟度不及阿里/字节，但 OpenAI 兼容层已稳定可用。
- 部分高端模型（如 GPT-4o、Claude）可能不在优云智算平台上线，这些需走七牛云聚合。
- 密钥体系（public_key + private_key）在非 OpenAI 兼容模式下有差异，但本项目只用 OpenAI 兼容模式，无影响。
