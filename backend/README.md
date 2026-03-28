# StudySolo Backend

> Python FastAPI 后端 API 服务，运行于 `port 2038`

## 1. 技术栈

| 维度 | 选型 |
| :--- | :--- |
| **框架** | Python 3.11 + FastAPI ≥0.115 |
| **服务器** | Uvicorn（ASGI） |
| **数据库** | Supabase (PostgreSQL) + Service Role Key |
| **认证** | JWT + Supabase Auth |
| **流式输出** | SSE (Server-Sent Events) via sse-starlette |
| **执行引擎** | 自研 DAG Executor（拓扑排序 + 黑板模型） |
| **AI 集成** | 8 平台 / 17+ 模型，3 种路由策略 |
| **测试** | pytest |

## 2. 快速启动

```bash
# 创建虚拟环境
python -m venv .venv

# Windows
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn app.main:app --reload --port 2038

# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 2038
```

- API 文档 (Swagger)：`http://localhost:2038/docs`
- 健康检查：`http://localhost:2038/api/health`

## 3. 环境变量

复制 `.env.production` 为 `.env`，并填入真实值：

| 变量 | 说明 | 必填 |
| :--- | :--- | :---: |
| `PORT` | 监听端口 | ✅ |
| `ENVIRONMENT` | `development` / `production` | ✅ |
| `SUPABASE_URL` | Supabase 项目地址 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 🔴 **绝不能泄露** | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | ✅ |
| `CORS_ORIGIN` | 允许的前端域名 | ✅ |
| `VOLC_*` | 火山引擎 API 配置 | ⚙️ |
| `DASHSCOPE_*` | 阿里 DashScope API 配置 | ⚙️ |
| `DEEPSEEK_*` | DeepSeek API 配置 | ⚙️ |
| `SMTP_*` | 邮件发送配置 | ⚙️ |

> ⚠️ `requirements.txt` 使用严格版本锁定（`==`）以兼容宝塔面板 Python 项目管理器。

## 4. 项目结构

```text
backend/
├── app/
│   ├── main.py               # FastAPI 入口（app 对象）
│   ├── api/                   # REST API 路由
│   │   ├── router.py          # 总路由聚合
│   │   ├── workflow.py        # 工作流 CRUD
│   │   ├── ai_chat.py         # AI 对话（SSE 流式）
│   │   ├── community.py       # 社区工作流
│   │   ├── admin_*.py         # 管理后台接口
│   │   └── ...
│   ├── engine/                # DAG 执行引擎
│   │   ├── dag_executor.py    # 拓扑排序 + 并行执行
│   │   └── execution_context.py # 黑板模型上下文
│   ├── nodes/                 # 18 种工作流节点实现
│   ├── prompts/               # 模块化 Prompt 文件（MD + Jinja2）
│   ├── core/                  # 配置、数据库、认证等核心模块
│   │   ├── config.py          # Pydantic Settings 配置
│   │   ├── database.py        # Supabase 客户端
│   │   └── auth.py            # JWT 认证中间件
│   └── services/              # 业务逻辑层
├── tests/                     # 测试代码
├── requirements.txt           # 生产依赖（== 锁定版本）
├── .env                       # 环境变量（不入 Git）
└── .env.production            # 环境变量模板
```

## 5. 测试

```bash
# 安装测试依赖
.venv\Scripts\pip install pytest httpx

# 运行测试
.venv\Scripts\python -m pytest tests -v
```

## 6. 生产部署

后端通过宝塔 Python 项目管理器运行：

```bash
# 启动命令（宝塔配置）
uvicorn app.main:app --host 127.0.0.1 --port 2038 --workers 4
```

| 配置项 | 值 | 说明 |
| :--- | :--- | :--- |
| `--host 127.0.0.1` | 仅监听本地 | 🔒 安全：外网无法直连 |
| `--port 2038` | 内部端口 | 由 Nginx 反向代理 |
| `--workers 4` | 4 个工作进程 | 提高并发处理能力 |

详细部署流程请参考 [服务器与宝塔部署完整指南](../docs/技术指导/服务器与宝塔部署完整指南.md)。

## 7. API 概览

| 路由前缀 | 功能 |
| :--- | :--- |
| `GET /api/health` | 健康检查 |
| `/api/workflows/*` | 工作流 CRUD |
| `/api/ai/*` | AI 对话 & 工作流生成 |
| `/api/community/*` | 社区工作流共享 |
| `/api/admin/*` | 管理后台 |
| `/api/auth/*` | 认证相关 |
| `/api/user/*` | 用户设置 |
