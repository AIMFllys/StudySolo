# StudySolo

> 最后更新：2026-03-26
> 文档编码：UTF-8（无 BOM） / LF

StudySolo 是一个 AI 学习工作流平台。用户在前端画布中组织节点，后端以 DAG 方式执行工作流，并通过 SSE 将 AI 输出实时返回到前端。

## 1. 当前技术栈

### 前端

- Next.js `16.1.6`
- React `19.2.3`
- TypeScript `5`
- Tailwind CSS `v4`
- Zustand
- `@xyflow/react`

### 后端

- FastAPI `>=0.115`
- Pydantic `>=2.10`
- Supabase Python `>=2.11`
- OpenAI SDK `>=1.60`
- SSE-Starlette

### 数据与共享层

- Supabase PostgreSQL + Auth + RLS + pgvector
- `shared/`：Git submodule，用于共享类型与跨项目规范

## 2. 仓库结构

```text
StudySolo/
├─ frontend/                 # Next.js 前端
├─ backend/                  # FastAPI 后端
├─ shared/                   # 共享子模块（Git submodule）
├─ supabase/migrations/      # 数据库迁移
├─ docs/                     # 项目规范与技术文档
├─ scripts/                  # 启动与部署脚本
└─ .agent/                   # 项目级 skills / rules / workflows
```

## 3. 本地启动

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

默认地址：`http://localhost:2037`

### 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt -r requirements-dev.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 2038
```

Swagger：`http://localhost:2038/docs`

### 一键启动

```powershell
powershell scripts/start-studysolo.ps1
```

## 4. 测试与检查

### 前端

```bash
cd frontend
pnpm lint
pnpm lint:lines
pnpm test
```

### 后端

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests
```

## 5. 核心架构要点

- 工作流节点体系由 `frontend/src/types/workflow.ts` 定义
- 当前边类型仅 `sequential`
- 当前节点状态包含 `waiting`、`skipped`
- AI 模型目录权威表是 `ai_model_families` + `ai_model_skus`
- 正式选型字段是 `selected_model_key`
- 正式计费字段统一 `*_cny`
- 当前后端 API 已覆盖：
  - auth
  - workflow CRUD / execute / social / collaboration
  - ai generate / chat / chat-stream / catalog
  - knowledge
  - exports
  - feedback
  - usage
  - admin 全组

## 6. 文档导航

- [项目架构全景](./docs/项目规范与框架流程/项目规范/项目架构全景.md)
- [命名规范](./docs/项目规范与框架流程/项目规范/naming.md)
- [API 规范](./docs/项目规范与框架流程/项目规范/api.md)
- [节点开发指南](./backend/app/nodes/CONTRIBUTING.md)
- [shared README](./shared/README.md)
- [shared AGENTS](./shared/AGENTS.md)

## 7. `shared` 与 Platform 的关系

必须区分两件事：

- 当前仓库中的 `shared/` 是 Git submodule
- Platform Monorepo 中的 `StudySolo/` 是 git subtree

不要把 `shared` 写成 git subtree，也不要把 Platform 中的 subtree 同步问题写成 `shared` 子模块问题。
