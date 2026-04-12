# 子后端 Agent 规范

> 文档版本：2.0.0
> 创建时间：2026-04-09
> 最后更新：2026-04-11
> 权威来源：`agents/README.md` + `docs/team/refactor/final-plan/agent-architecture.md`

---

## 1. 概述

子后端 Agent 是独立部署的 HTTP 服务，封装特定功能域的 AI 能力，通过 **OpenAI Chat Completions 兼容协议**与主后端通信。

> **重要**：Agent 目录位于项目根级 `agents/`（**不是** `backend/app/services/`）。这是 Phase 4B 确立的新结构。

### 1.1 Agent 与主后端的关系

```
用户请求 → 主前端 → 主后端 (AgentGateway) → 子后端 Agent → AI Provider
                                         ↑
                                    你在这里开发
```

### 1.2 目录结构（Phase 4B 确立）

```
StudySolo/
├── agents/                                  ← Agent 根目录
│   ├── README.md                            ← 开发总指南（权威）
│   │
│   ├── _template/                           ← 模板（复制即用）
│   │   ├── src/
│   │   │   ├── main.py                     ← FastAPI 入口
│   │   │   ├── config.py                   ← pydantic-settings 配置
│   │   │   ├── router.py                   ← 路由注册
│   │   │   ├── endpoints/
│   │   │   │   ├── health.py              ← GET /health
│   │   │   │   ├── models.py              ← GET /v1/models
│   │   │   │   └── completions.py         ← POST /v1/chat/completions
│   │   │   ├── core/
│   │   │   │   ├── agent.py               ← Agent 核心逻辑
│   │   │   │   └── prompts.py             ← Prompt 模板
│   │   │   ├── schemas/
│   │   │   │   ├── request.py
│   │   │   │   └── response.py
│   │   │   └── middleware/
│   │   │       └── auth.py                ← API Key 验证
│   │   ├── tests/
│   │   │   ├── conftest.py
│   │   │   └── test_contract.py           ← 四层兼容性测试
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── pyproject.toml
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── code-review-agent/                  ← 小李 开发中
│   ├── deep-research-agent/                ← 迁移自 ResearchAgents
│   ├── news-agent/                         ← 迁移自 NewsAgents
│   ├── study-tutor-agent/                  ← 规划中
│   └── visual-site-agent/                  ← 规划中
│
└── backend/
    └── config/
        └── agents.yaml                     ← Gateway 注册表
```

---

## 2. 四层兼容性协议

> **权威定义**：[agent-architecture.md](../../team/refactor/final-plan/agent-architecture.md)
>
> 四层协议的完整 Pydantic Schema、错误码、超时链规则、日志格式和安全要求均以上述冻结文档为准。本节仅提供速查摘要。

| 层级 | 关键要求 | 验证方式 |
|------|---------|---------|
| **Layer 1: Request** | `POST /v1/chat/completions`，Header 认证 + Body 为 OpenAI 格式 | Schema 校验 |
| **Layer 2: Response** | 非流式 JSON + 流式 SSE（`data: {json}\n\n` + `[DONE]`）+ 统一错误码 | 契约测试 |
| **Layer 3: Runtime** | `GET /health` + `GET /health/ready` + `GET /v1/models` + 超时链 | 集成测试 |
| **Layer 4: Governance** | `agents.yaml` 注册 + 端口分配 + stdout JSON 日志 + API Key 中间件 | Gateway 检查 |

端口分配表和 `agents.yaml` 注册格式见 [agents/README.md](../../../agents/README.md)。

---

## 3. 新增 Agent 流程

> **详细指南**：`agents/README.md`

### Step 1：复制模板

```bash
cp -r agents/_template agents/my-new-agent
```

### Step 2：实现核心逻辑

编辑 `agents/my-new-agent/src/core/agent.py`：

```python
class MyNewAgent:
    async def generate(self, messages: list[dict], stream: bool = False):
        """处理用户消息，返回 AI 响应"""
        system_prompt = build_system_prompt()
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        if stream:
            return self._stream_response(full_messages)
        else:
            return await self._sync_response(full_messages)
```

### Step 3：注册到 Gateway

在 `backend/config/agents.yaml` 中添加配置。

### Step 4：运行四层契约测试

```bash
pytest agents/my-new-agent/tests/test_contract.py -v
```

---

## 4. 技术栈要求

| 维度 | 要求 |
|------|------|
| 语言 | Python 3.11+ |
| 框架 | FastAPI |
| 运行 | uvicorn |
| 配置 | pydantic-settings |
| AI SDK | openai >= 1.60 |
| 测试 | pytest + httpx |
| 类型 | Pydantic V2 |
| 容器 | Dockerfile + docker-compose |

---

## 5. 本地开发

```bash
cd agents/code-review-agent

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY 等

# 启动
python -m src.main
# → Uvicorn running on http://127.0.0.1:8001

# 测试
pytest tests/ -v
```

---

## 6. 错误响应格式

所有错误必须返回以下格式：

```json
{
  "error": {
    "message": "错误描述",
    "type": "authentication_error | invalid_request_error | not_found_error | rate_limit_error | internal_error | service_unavailable",
    "code": "invalid_api_key | missing_model | empty_messages | model_not_found | rate_limit_exceeded | upstream_error | agent_overloaded"
  }
}
```

---

## 7. 日志规范

Agent 日志必须输出到 stdout，JSON 格式：

```json
{
  "timestamp": "2026-04-10T12:00:00Z",
  "level": "INFO",
  "message": "Request processed",
  "request_id": "uuid-xxx",
  "agent": "code-review",
  "duration_ms": 1200
}
```

推荐使用 `python-json-logger` 或 `structlog`。

---

## 8. 安全要求

| 要求 | 说明 |
|------|------|
| API Key 验证 | 必须实现，通过 middleware 拦截 |
| CORS | 开发：`allow_origins=["*"]`；生产：限制为 Gateway IP |
| 环境变量 | API Key 等敏感信息必须通过环境变量注入，禁止硬编码 |
| `.env.example` | 每个 Agent 必须提供环境变量模板 |
| HTTPS | 生产环境通过 Nginx 反代提供 TLS |

---

## 9. FAQ

**Q：Agent 的数据库怎么处理？**
A：Agent 不应该直接操作主系统的 Supabase。如果 Agent 需要持久化，在自己的目录内用 SQLite 或独立数据库。主系统数据通过 Gateway API 传递。

**Q：Agent 如何使用主系统的用户信息？**
A：通过 Gateway 调用时，主后端在 Header 中传递 `X-User-Id`。Agent 不直接访问 Supabase 的 auth 表。

**Q：可以用 JavaScript/TypeScript 写 Agent 吗？**
A：**不可以。** 团队统一使用 Python + FastAPI，降低维护成本。

---

## 10. Phase 4B 完成状态

### 10.1 代码审查 Agent（`code-review-agent`）

**已完成能力**：
- ✅ 最小可运行 FastAPI 服务
- ✅ `GET /health` + `GET /health/ready` + `GET /v1/models` + `POST /v1/chat/completions`
- ✅ non-stream + SSE stream 响应
- ✅ 7 类固定规则审查（硬编码密钥、危险动态执行、危险 HTML sink、Shell 命令执行、关闭 TLS 校验、调试遗留、宽泛吞错）
- ✅ 多文件 unified diff 感知
- ✅ live upstream findings 治理（evidence anchoring、known-rule metadata canonicalization、unknown-rule groundedness 治理）
- ✅ repo-context forwarding governance（归一化、去重、关系排序、预算裁剪）
- ✅ 四层契约测试通过（87 passed）

**仍未实现**：
- ⚠️ 不读取本地仓库文件
- ⚠️ 不透传 provider usage
- ⚠️ Agent Gateway 注册（Phase 5）

### 10.2 Phase 5 后续计划

- [ ] `backend/config/agents.yaml` Agent 注册表
- [ ] Agent Gateway 主后端接入层
- [ ] `deep-research-agent` 迁移
- [ ] `news-agent` 迁移
- [ ] Wiki 文档

## 11. 参考文档

| 文档 | 说明 |
|------|------|
| `agents/README.md` | Agent 开发总指南 |
| `docs/team/refactor/final-plan/agent-architecture.md` | 四层协议完整规范 |
| `docs/team/refactor/final-plan/phase-4-nodes-and-agents.md` | Phase 4 任务分解 |
| `docs/team/refactor/final-plan/phase-5-integration.md` | Phase 5 Gateway 实现计划 |
