# 共享数据库规范

> 最后更新：2026-03-26
> 文档编码：UTF-8（无 BOM） / LF

本文档是 1037Solo 共享数据库的快速参考，覆盖命名、前缀、RLS 与共享层边界。

## 1. 前缀规则

| 前缀 | 归属 | 说明 |
| --- | --- | --- |
| 无前缀 | Shared | 跨项目共享表 |
| `ss_` | StudySolo | StudySolo 业务表 |
| `pt_` | Platform | Platform 业务表 |
| `fm_` | Forum | Forum 业务表 |
| `_` | System Metadata | 系统元数据 |

## 2. 当前共享层核心表

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

## 3. StudySolo 关键表

- `ss_workflows`
- `ss_workflow_runs`
- `ss_ai_conversations`
- `ss_ai_messages`
- `ss_ai_requests`
- `ss_ai_usage_events`
- `ss_ai_usage_minute`
- `ss_usage_daily`
- `ss_feedback`
- `ss_notices`
- `ss_notice_reads`
- `ss_ratings`
- `ss_system_config`
- `ss_admin_accounts`
- `ss_admin_audit_logs`
- `ss_kb_documents`
- `ss_kb_document_summaries`
- `ss_kb_document_chunks`
- `ss_kb_chunk_embeddings`
- `ss_kb_summary_embeddings`

## 4. RLS 规则

- 所有 public 业务表默认必须启用 RLS
- Policy 中统一使用 `(SELECT auth.uid())`
- `service_role` 专用表可使用 `FOR ALL USING (false)` 等锁定策略

## 5. 命名规则

- 表名：`snake_case`
- 字段名：`snake_case`
- 主键：优先 `id`
- 外键：`{resource}_id`
- 时间字段：`created_at`、`updated_at`、`started_at`、`expires_at`

## 6. AI 目录与计费规则

- 模型目录权威表：`ai_model_families` + `ai_model_skus`
- `ai_models` 是兼容层，不是新的主目录
- 正式金额字段统一 `*_cny`
- 正式模型选择主键是 `selected_model_key`

## 7. 新建表检查清单

- 是否使用了正确前缀
- 是否启用了 RLS
- Policy 是否使用 `(SELECT auth.uid())`
- 是否需要同步更新 `shared/src/types/database.ts`
- 是否需要同步更新共享文档和项目文档
