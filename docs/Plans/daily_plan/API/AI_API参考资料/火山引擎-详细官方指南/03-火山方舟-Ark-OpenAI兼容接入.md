# 火山方舟（Ark）OpenAI 兼容接入

> 检索日期：2026-02-26

---

## 1. 官方资料

| 文档 | 链接 |
|------|------|
| 火山方舟大模型推理（文档入口） | https://www.volcengine.com/docs/82379/1099522 |
| 兼容 OpenAI SDK 调用 | https://www.volcengine.com/docs/82379/1330626 |
| Base URL 及 API Key | https://www.volcengine.com/docs/82379/1414148 |

---

## 2. 接入概要

### 2.1 Base URL & SDK

| 配置项 | 值 |
|--------|-----|
| **Base URL** | `https://ark.cn-beijing.volces.com/api/v3` |
| **SDK** | `openai>=1.0`（Python） |
| **鉴权方式** | API Key（Bearer Token） |

```bash
pip install --upgrade "openai>=1.0"
```

### 2.2 基础调用示例（Python）

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key=os.getenv("ARK_API_KEY"),
)

# Chat Completions 方式
response = client.chat.completions.create(
    model="doubao-seed-2-0-pro-260215",
    messages=[
        {"role": "user", "content": "你好，请介绍一下你自己"}
    ],
)
print(response.choices[0].message.content)
```

### 2.3 多模态调用示例（cURL）

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seed-2-0-pro-260215",
    "reasoning_effort": "medium",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg"
                    }
                },
                {
                    "type": "text",
                    "text": "图片主要讲了什么?"
                }
            ]
        }
    ]
}'
```

### 2.4 支持的 API 端点

| API | 路径 |
|-----|------|
| Chat Completions | `/v3/chat/completions` |
| Responses | `/v3/responses` |
| Tokenization | `/v3/tokenization` |

---

## 3. Doubao-Seed-2.0 模型系列

> 围绕大规模生产环境使用需求做了系统性优化，通过 **pro / lite / mini / Code** 全系列尺寸，为不同规模与复杂度的应用场景提供专业级支持。

### 3.1 模型一览表

| 模型 | Model ID | 定位 | 输入价格 | 输出价格 | 缓存命中 |
|------|----------|------|----------|----------|----------|
| **Pro** | `doubao-seed-2-0-pro-260215` | 旗舰全能，长链路推理 & 复杂任务 | ¥3.2/M tokens | ¥16/M tokens | ¥0.64/M tokens |
| **Lite** | `doubao-seed-2-0-lite-260215` | 性能与成本均衡，通用生产级 | ¥0.6/M tokens | ¥3.6/M tokens | ¥0.12/M tokens |
| **Mini** | `doubao-seed-2-0-mini-260215` | 低时延、高并发、成本敏感 | ¥0.2/M tokens | ¥2/M tokens | ¥0.04/M tokens |
| **Code** | `doubao-seed-2-0-code-preview-260215` | 代码增强版 | — | — | — |

> **价格基准**：输入 ≤ 32k tokens 时的分段计费，单位 元/百万 tokens。  
> **缓存存储费**：¥0.017 / 百万 tokens / 小时（全系列统一）。

### 3.2 通用规格

| 参数 | 值 |
|------|-----|
| 上下文窗口 | 256k |
| 最大输入 Token | 256k |
| 最大输出 Token | 128k |
| 最大思考内容 Token | 128k |
| TPM | 5,000k |
| RPM | 30k |
| 输入类型 | 文字、图片、视频 |
| 输出类型 | 文字 |

### 3.3 通用能力矩阵

| 能力 | 支持情况 |
|------|----------|
| 深度思考（thinking） | ✅ `thinking.type` / `reasoning_effort` |
| 结构化输出 | ✅ |
| Function Call | ✅ |
| 联网搜索 | ✅（Responses API） |
| 知识库 | ✅（Responses API） |
| MCP | ✅（Responses API） |
| 模型精调 | ✅ |
| 在线推理 / 批量推理 | ✅ |
| 上下文缓存 | ✅（隐式缓存） |

---

## 4. 各模型详细说明

### 4.1 Doubao-Seed-2.0-Pro

**定位**：旗舰级全能通用模型，面向 Agent 时代的复杂推理与长链路任务执行。

**核心优势**：
- **企业级 Agent 编排** — 知识密集型流程中的检索、工具调用与多步任务可自动编排并稳定交付
- **复杂指令执行** — 多约束、多步骤、长链路任务的理解与执行能力显著增强
- **多模态理解升级** — 视觉感知/推理/空间理解全面增强，复杂版式文档与图表解析更稳
- **长视频 & 实时流** — 支持小时级长视频连贯理解，具备流式实时分析与主动反馈
- **ToB 场景适配** — 信息抽取、参考问答、文本分析等高频企业工作流能力提升

> 💡 **Coding 场景** 优先推荐 `doubao-seed-2-0-code-preview-260215`。

---

### 4.2 Doubao-Seed-2.0-Lite

**定位**：面向高频企业场景，兼顾性能与成本的均衡型模型，综合能力超越上一代 Doubao-Seed-1.8。

**核心优势**：
- **Agent 可用性增强** — 指令遵循、推理、工具调用等能力大幅增强
- **多模态更实用** — 图文信息抽取、视频时空理解、grounding 能力更强
- **面向规模化部署** — 保持能力优势的同时更低成本，适合高频调用

---

### 4.3 Doubao-Seed-2.0-Mini

**定位**：面向低时延、高并发与成本敏感场景，提供极致推理速度。效果与 Doubao-Seed-1.6 相当。

**核心优势**：
- **极致性价比** — 非思考模式效果达思考模式 85%，tokens 消耗仅 1/10
- **相比 1.6-flash 大幅提升** — 内容识别和知识推理显著增强，超越上一代 1.6-pro
- **ToB 识别能力更强** — 图像审核、分类、视频巡检等领域识别能力显著提升，异常模式下降 40%

---

## 5. 关键参数说明

### 5.1 `reasoning_effort`（思考深度）

支持四档调节：

| 档位 | 说明 |
|------|------|
| `minimal` | 不思考（直接输出） |
| `low` | 浅层思考 |
| `medium` | 中等思考（推荐默认） |
| `high` | 深度思考 |

### 5.2 `temperature` & `top_p`

> ⚠️ **Seed-2.0 系列固定参数**：`temperature = 1`，`top_p = 0.95`。  
> API 请求中传入的值将被**忽略**，以系统固定值为准。

### 5.3 视觉质量档位（`detail`）

提供分档的图像质量与资源预算策略：

| 档位 | 适用场景 |
|------|----------|
| `low` | 快速预览、简单识别 |
| `high` | 默认模式，通用场景 |
| `xhigh` | 高密度文本、复杂图表、细节丰富场景 |

### 5.4 隐式缓存

- **无需额外配置**，自动开启
- 请求内容的公共前缀被自动缓存（不保证命中）
- 通常需累计 **≥ 1024 tokens** 才会触发缓存命中
- 命中缓存部分按缓存命中价格计费

---

## 6. 与 StudySolo 规划的映射

| 配置项 | 当前值 |
|--------|--------|
| `VOLCENGINE_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` |
| `VOLCENGINE_MODEL` | `doubao-2.0-pro`（需映射为 `doubao-seed-2-0-pro-260215`） |

**结论**：可按 OpenAI 兼容方式接入统一 `openai` SDK 客户端，无需额外适配层。

---

## 7. 接入检查清单

- [ ] 控制台确认模型接入点已创建并可用
- [ ] API Key 权限覆盖目标接入点
- [ ] 后端 `base_url` 与模型名放入可配置项（环境变量 / config.yaml）
- [ ] 流式场景配合 SSE 输出，避免网关缓冲
- [ ] `temperature` / `top_p` 不可自定义（Seed-2.0 系列固定）
- [ ] 区分"控制面 API"（接入点/密钥管理）与"推理调用面"，排错时需注意
- [ ] `ark.cn-beijing.volces.com/api/v3` 需与实际区域和账号权限一致