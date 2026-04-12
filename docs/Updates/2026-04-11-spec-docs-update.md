# 规范文档全面更新

> 日期：2026-04-11
> 负责人：羽升
> 更新范围：`docs/项目规范与框架流程/`、`shared/docs/conventions/`、`.agent/skills/project-context/`

---

## 更新背景

项目已完成 Phase 0-3 重构（Phase 4 进行中），但多个规范文档仍停留在 2026-03-26 的状态。本次更新彻底同步了 Phase 2（后端核心重构）+ Phase 3（前端架构重构）的完成状态到所有规范文档。

---

## 更新清单

### 1. project-context SKILL.md

**文件**：`.agent/skills/project-context/SKILL.md`
**版本**：v3.0 → **v4.0**

**关键变更**：
- 仓库地图：新增 `agents/` 目录说明
- 后端结构：反映 `api/workflow/`、`api/ai/` 子目录重组
- 前端结构：反映 `stores/` 子目录重组（workflow/chat/ui/admin）
- TypedEventBus：`frontend/src/lib/events/event-bus.ts` 新增说明
- Agent 体系：端口分配表（8001-8005）
- API 分组：更新路由文件来源（`api/workflow/`、`api/ai/`）
- 工作流节点：`workflow-meta.ts` 确认继续承担结构职责（Phase 3 冻结边界）
- 重构状态表：Phase 0-3 ✅ 完成，Phase 4 🔨 进行中

---

### 2. 子后端 Agent 规范

**文件**：`docs/项目规范与框架流程/项目规范/04-子后端Agent规范.md`
**版本**：v1.0.0 → **v2.0.0**

**关键变更**：
- Agent 目录结构：从 `services/` 更新为 `agents/`（Phase 4B 确立）
- 引用 `agents/README.md` 作为权威来源
- 引用 `docs/team/refactor/final-plan/agent-architecture.md` 作为四层协议权威
- 端口分配表：8001（code-review）、8002（deep-research）、8003（news）
- 新增 Agent 流程：复制模板 → 实现逻辑 → Gateway 注册 → 契约测试
- 清理废弃的服务目录引用

---

### 3. 插件开发规范

**文件**：`docs/项目规范与框架流程/项目规范/03-插件开发规范.md`
**版本**：v1.0.0 → **v2.0.0**

**关键变更**：
- 清理废弃路径引用（`docs/plan/TeamNewRefactor/` → `docs/team/refactor/`）
- 节点目录结构：明确 `backend/app/nodes/` 下标准节点和社区节点结构
- 节点分类更新：input/analysis/generation/interaction/output/structure/community
- 子后端 Agent 部分重写：引用 `agents/` 目录而非 `services/`
- 新增插件分类 SOP 引用：`docs/.../功能流程/新增AI工具/00-节点与插件分类判断.md`

---

### 4. 模块边界规范

**文件**：`docs/项目规范与框架流程/项目规范/02-模块边界规范.md`
**版本**：v1.0.0 → **v2.0.0**

**Phase 2 完成项标记**：
- ✅ AI Chat 合并（`ai_chat.py` + `ai_chat_stream.py` → `api/ai/chat.py`）
- ✅ Workflow 路由重组（4 散文件 → `api/workflow/` 子目录）
- ✅ AI 路由重组（5 散文件 → `api/ai/` 子目录）
- ✅ `@track_usage` 装饰器实现并推广
- ✅ LLM import 切换到 `app.services.llm.*` canonical 模块

**Phase 3 完成项标记**：
- ✅ Store 跨域解耦（`useAIChatStore` 不再直接调用 `useConversationStore`）
- ✅ `stores/` 重组为子目录结构
- ✅ `workflow.service.ts` / `workflow.server.service.ts` 重复已显著收薄
- ✅ TypedEventBus 两批迁移完成
- ✅ manifest-first UI 六个闭环已落地

---

### 5. API 规范

**文件**：`docs/项目规范与框架流程/项目规范/api.md`
**日期**：2026-03-26 → **2026-04-11**

**关键变更**：
- 认证接口来源更新：`api/auth/` 路由包
- Workflow CRUD/执行接口：标注来源 `api/workflow/` 子目录
- AI Chat：标注 Phase 2 合并变更（`ai_chat.py` + `ai_chat_stream.py` → `api/ai/chat.py`）
- AI 模型目录：标注来源 `api/ai/catalog.py`、`api/ai/models.py`
- 移除已合并的旧路由文件引用
- 新增 Phase 2 重构变更记录章节

---

### 6. 前端工程规范

**文件**：`docs/项目规范与框架流程/项目规范/frontend-engineering-spec.md`
**日期**：2026-03-25 → **2026-04-11**

**关键变更**：
- `stores/` 重组后结构：workflow/chat/ui/admin 子目录
- compat shim 保留策略说明
- TypedEventBus 新增规则：新代码必须使用 TypedEventBus，逐步替换 CustomEvent
- Store 解耦完成状态：跨 store 同步改为调用方显式处理
- Manifest-First 原则：Phase 3 确认 `workflow-meta.ts` 继续承担结构职责

---

### 7. shared/project-boundaries.md

**文件**：`shared/docs/conventions/project-boundaries.md`
**日期**：2026-03-26 → **2026-04-11**

**关键变更**：
- 清理废弃路径引用（`docs/plan/TeamNewRefactor/`、`docs/Plans/TNRCodex/`）
- 新增当前规范文档结构说明（完整目录树）
- 文档权威层级表：L0 → L3 定义
- 重构状态表：Phase 0-5 当前状态

---

### 8. shared/database.md

**文件**：`shared/docs/conventions/database.md`
**日期**：2026-03-26 → **2026-04-11**

**关键变更**：
- AI catalog 权威表确认（`ai_model_families`、`ai_model_skus`）
- 计费字段规范与 Phase 1 冻结契约对齐
- 新建表检查清单新增计费字段检查项
- Phase 2/3 变更记录

---

### 9. AI 调用及计费分析统一规范

**文件**：`docs/项目规范与框架流程/项目规范/项目AI调用及计费分析统一规范.md`
**日期**：2026-03-26 → **2026-04-11**

**关键变更**：
- 运行时路由层位置：`services/ai_router.py` → `services/llm/router.py`（Phase 2）

---

### 10. 项目架构全景

**文件**：`docs/项目规范与框架流程/项目规范/项目架构全景.md`
**日期**：2026-03-26 → **2026-04-11**

**关键变更**：
- Header 更新：Phase 2 + Phase 3 完成状态

---

## 废弃路径清理

以下路径已在本次更新中统一替换：

| 废弃路径 | 更改为 |
|----------|--------|
| `docs/plan/TeamNewRefactor/*` | `docs/team/refactor/*` |
| `docs/Plans/TNRCodex/*` | `docs/team/refactor/codex-analysis/*` |
| `services/`（Agent 部分） | `agents/` |
| `nodes/nodes/`（旧节点路径） | `backend/app/nodes/` |
| `services/ai_router.py`（旧） | `backend/app/services/llm/router.py` |

---

## 验证状态

- [x] 每个文档更新后确认无遗留废弃路径引用
- [x] project-context 更新后反映最新项目结构
- [x] 所有被引用文档确认存在且内容匹配

---

## 相关文档

| 文档 | 说明 |
|------|------|
| `docs/team/refactor/final-plan/00-索引.md` | 重构计划总览 |
| `docs/team/refactor/final-plan/phase-2-backend-refactor.md` | Phase 2 详细任务 |
| `docs/team/refactor/final-plan/phase-3-frontend-refactor.md` | Phase 3 详细任务 |
| `agents/README.md` | Agent 开发总指南 |
| `docs/team/refactor/final-plan/agent-architecture.md` | 四层协议规范 |
