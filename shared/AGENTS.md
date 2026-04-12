# AI Agent Context — 1037Solo Shared Module

> 最后更新：2026-04-12
> 文档编码：UTF-8（无 BOM） / LF

本文档是 AI 助手在 1037Solo 共享层工作时的强制上下文。无论任务落在 StudySolo 还是 Platform，只要触及 `shared/`、共享数据库或跨项目边界，都必须优先遵守此文档。

## 1. 共享层职责

`shared/` 负责：

- 共享数据库认知
- 共享 TypeScript 类型
- 跨项目命名与边界约束
- Platform / StudySolo 同步说明

## 2. 关键事实

### 2.1 两种同步关系必须区分

- 当前 StudySolo 仓库中的 `shared/`：Git submodule
- Platform Monorepo 中的 `StudySolo/`：git subtree

### 2.2 数据库前缀

- 无前缀：共享层
- `ss_`：StudySolo
- `pt_`：Platform
- `fm_`：Forum
- `_`：系统元数据

### 2.3 认证边界

StudySolo：

- Supabase Auth
- JWT
- `user_profiles` 为业务用户表

Platform：

- 保留 legacy 认证与 legacy 表
- 不与 StudySolo 共享同一套应用层认证实现

## 3. 当前共享数据库认知

### 3.1 共享层表

- `user_profiles`
- `subscriptions`
- `addon_purchases`
- `payment_records`
- `student_verifications`
- `tier_change_log`
- `verification_codes_v2`
- `captcha_challenges`
- `auth_rate_limit_events`
- `ai_model_families`
- `ai_model_skus`
- `ai_models`（兼容层）

### 3.2 StudySolo 关键表

- `ss_workflows`
- `ss_workflow_runs`
- `ss_ai_conversations`
- `ss_ai_messages`
- `ss_ai_requests`
- `ss_ai_usage_events`
- `ss_ai_usage_minute`
- `ss_usage_daily`
- `ss_notices`
- `ss_notice_reads`
- `ss_ratings`
- `ss_system_config`
- `ss_feedback`
- `ss_kb_*`

## 4. 文档编写规则

- 所有共享文档以迁移文件、接口代码、`.gitmodules` 为准
- 中文文档统一 UTF-8（无 BOM） / LF
- 如果一个事实只在某个项目内成立，不要提升为共享层事实
- 如果一个规则同时影响 Platform 和 StudySolo，应优先放到 `shared/docs/`

## 5. 强约束

- 不把 `shared/` 说成 git subtree
- 不把 StudySolo subtree 冲突问题归因到 `shared`
- 不把 `selected_platform + selected_model` 写成正式主模型入口
- 不把 `*_usd` 写成新的正式计费字段

## 6. 首选事实源

- `.gitmodules`
- `shared/src/types/database.ts`
- `shared/docs/conventions/*`
- `backend/app/api/*`
- `backend/app/models/*`
- `frontend/src/types/*`
- `backend/config.yaml`
- `supabase/migrations/*`
