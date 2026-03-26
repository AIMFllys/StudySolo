<!-- 编码：UTF-8 -->

# StudySolo 文档入口

> 最后更新：2026-03-16
> 当前状态：文档基于真实代码审查全面更新，旧计划仅保留历史价值

## 先看什么

1. [项目规范与框架流程/项目规范/项目架构全景.md](项目规范与框架流程/项目规范/项目架构全景.md)
   唯一可信的架构全景文档，包含前后端完整结构、技术栈、部署架构、边界约束。
2. [summary/current-engineering-baseline.md](summary/current-engineering-baseline.md)
   当前工程基线，只写已经落地的真实状态、门禁命令和事实源优先级。
3. [项目规范与框架流程/项目规范/progress.md](项目规范与框架流程/项目规范/progress.md)
   当前开发进度、已完成项和下一阶段待办。
4. [项目规范与框架流程/项目规范/frontend-engineering-spec.md](项目规范与框架流程/项目规范/frontend-engineering-spec.md)
   前端工程约束，已按 `features/workflow`、`features/knowledge` 等新结构更新。

## 当前可信事实

- 后端执行入口统一到 `backend/app/engine/executor.py`
- 用户认证路由已经拆分为 `backend/app/api/auth/` 包（login/register/captcha/_helpers）
- 知识库处理已经下沉到 `services/document_service.py` 与 `services/knowledge_service.py`
- 前端 workflow、knowledge、admin、auth、settings 已完成 feature 化
- `components/business/` 已退出当前前端结构
- 前端图标以 Lucide React 为主，Material Symbols 为辅（本地静态字体）
- SSE 本轮只做内部标准化，外部兼容事件名保持不变
- Supabase 现状以实时项目和 MCP 核验结果为准

## 文档分层

- `项目规范与框架流程/项目规范/`
  项目规范文件：架构全景、API 契约、设计规范、命名规范、前端工程规范、开发进度。
- `项目规范与框架流程/项目介绍/`
  面向项目理解的介绍型文档（产品概述、节点体系）。
- `Plans/`
  规划、阶段任务和专题方案。当前以 `daily_plan/refactor/` 为主。
- `summary/`
  当前工程基线和历史阶段总结。历史总结仅用于追溯。
- `Updates/`
  每日更新日志，只记录当时做了什么，不自动代表当前结构。
- `技术指导/`
  概念图与深度技术指导文档。

## 文档治理规则

- 与当前架构直接冲突、会误导开发的旧文档，不删除，只重命名为 `已过期-*`
- 历史总结和更新日志可以保留，但默认不高于代码、测试和当前入口文档
- 涉及数据库现状、RLS、迁移数量、共享表结构的描述，必须以实时核验结果为准

## 共享规范

- 跨项目 Supabase/Auth/命名约束：[../shared/AGENTS.md](../shared/AGENTS.md)
- 共享数据库规范：[../shared/docs/conventions/database.md](../shared/docs/conventions/database.md)
- 跨项目决策记录：[../shared/docs/decisions/log.md](../shared/docs/decisions/log.md)
