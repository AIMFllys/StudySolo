# 七牛云 AI（QNAIGC）OpenAI 兼容接入

## 官方资料（最新检索）

- 七牛云 AI 大模型推理服务（产品主页）
  https://www.qiniu.com/products/ai-inference
- 七牛云 AI 模型广场（可用模型一览）
  https://qnaigc.com
- 开发者中心 · OpenAI 兼容 Chat 接口文档
  https://developer.qiniu.com/ai/16383/qiniu-ai-openai-api
- 开发者中心 · Anthropic 兼容接口文档
  https://developer.qiniu.com/ai/16384/qiniu-ai-anthropic-api
- Token 价格与计费说明
  https://developer.qiniu.com/ai/16261/billing

> 检索日期：2026-02-26

## 与 StudySolo 规划的映射

- 在四平台路由中定位为 **⭐ 第 1 优先**。
- 环境变量：
  - `QINIU_AI_API_KEY`（Bearer Token 认证）
  - Base URL 固定为：`https://api.qnaigc.com/v1`
- 角色定位：**模型聚合层** — 海外模型（GPT-4o、Claude 3.5、Gemini 2.5）全部经由七牛云代理调用，省去逐一对接原厂的工作。

## 接入关键点

1. **协议兼容性**：
   - 完全兼容 OpenAI `/v1/chat/completions`（含 stream=True）。
   - 同时兼容 Anthropic `/v1/messages` 标准（用于 Claude 系列）。
   - 直接使用 `openai` Python SDK，替换 `api_key` 和 `base_url` 即可。

2. **模型标识**：
   - 模型名直接传原厂 ID，如 `deepseek-r1`、`qwen3-turbo`、`doubao-2.0-pro`、`gpt-4o`。
   - 无需额外的 Endpoint ID 或模型映射。

3. **免费额度**：
   - 新用户注册即赠 **300 万 Token**（全模型通用）。
   - 邀请奖励：邀请 1 人 → 邀请者 +500 万 Token，被邀者 +1000 万 Token。

4. **计费方式**：
   - 按量计费（Token 消耗 × 模型单价），每月初结算出账。
   - 可购买资源包获得折扣（国产编程包、融合包等）。

5. **SSE 流式**：
   - 完全支持 `stream=True`，响应格式与 OpenAI 原生一致。
   - 配合项目 Nginx 的 `proxy_buffering off` 可正常流式推送。

## 最小示例（OpenAI SDK 方式）

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-qiniu-ai-api-key",
    base_url="https://api.qnaigc.com/v1",
)

# 非流式
resp = client.chat.completions.create(
    model="deepseek-r1",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)

# 流式
stream = client.chat.completions.create(
    model="qwen3-turbo",
    messages=[{"role": "user", "content": "请列出 React Hooks 的核心概念"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

## 可用模型矩阵（StudySolo 相关）

| 模型 | 模型 ID | 类型 | 与其他平台重叠 |
|------|---------|------|--------------|
| DeepSeek-R1 | `deepseek-r1` | 推理 | ✅ 优云/火山 |
| DeepSeek-V3 | `deepseek-v3` | 通用 | ✅ 优云/火山 |
| Qwen3-Turbo | `qwen3-turbo` | 复杂 | ✅ 优云/百炼 |
| Qwen2.5-72B | `qwen2.5-72b-instruct` | 长文 | ✅ 优云/百炼 |
| 豆包 2.0-pro | `doubao-2.0-pro` | 简单 | ✅ 火山 |
| GPT-4o | `gpt-4o` | 海外 | 仅七牛 |
| Claude 3.5 | `claude-3-5-sonnet` | 海外 | 仅七牛 |
| Gemini 2.5 | `gemini-2.5-pro` | 海外 | 仅七牛 |
| Kimi | `kimi` | 长文 | ✅ 优云 |
| GLM-4 | `glm-4` | 中文 | ✅ 优云 |

## 更详细指南（本地参考）

> 💡 以下指南存储于 `./七牛云-更详细指南.md/` 目录下，包含各专项能力的 API 参数说明与示例。

- [**模型广场清单**](./七牛云-更详细指南.md/模型广场.md)：各厂商模型详细列表与实时计费建议。
- [**聊天补全参数说明**](./七牛云-更详细指南.md/聊天补全接口参数说明.md)：详细的 Request Body 参数详解。
- [**实时推理请求 API**](./七牛云-更详细指南.md/实时推理请求%20API%20接入说明🚀.md)：高并发、低延迟接入方案。
- [**全网搜索 API**](./七牛云-更详细指南.md/全网搜索API.md)：集成百度 Search 的联网搜索能力。
- [**图片生成 (Kling)**](./七牛云-更详细指南.md/图片生成.md)：文生图、图生图详细参数。
- [**视频生成 (Kling/Vidu)**](./七牛云-更详细指南.md/视频生成.md)：长视频生成的异步回调机制。
- [**图片文档识别 (OCR)**](./七牛云-更详细指南.md/图片文档识别OCR%20API%20接入说明.md)：多场景文字识别。
- [**批量任务推理**](./七牛云-更详细指南.md/批量任务推理%20API%20接入说明🚆.md)：适用于大规模离线数据处理。
- [**大模型 Token 用量查询**](./七牛云-更详细指南.md/大模型Token用量查询.md)：实时监控额度消耗。
- [**管理员批量创建 API Key**](./七牛云-更详细指南.md/管理员批量创建API%20Key.md)：面向团队的多 Key 管理。
- [**MCP 使用说明**](./七牛云-更详细指南.md/MCP%20使用说明⚒️.md)：如何在 IDE 或桌面应用中集成。

## 风险提示

- 七牛云作为聚合层，海外模型（GPT/Claude/Gemini）的延迟会高于直连原厂，但免去了科学上网和多密钥管理的负担。
- 免费额度用尽后需购买资源包或按量计费，注意监控消耗。
- 若七牛云平台本身不可用，系统应按优先级降级到优云智算。
