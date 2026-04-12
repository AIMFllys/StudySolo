# 共享数据库规范

> 最后更新：2026-04-12
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

### 6.1 权威表

- `ai_model_families` — 模型族（如 "通义千问"、"DeepSeek"）
- `ai_model_skus` — 可计费/可路由的具体模型条目
- `ai_models` — 兼容层（已降级，不是新权威）

### 6.2 计费字段规范（Phase 1 冻结）

| 字段 | 说明 | 状态 |
|------|------|------|
| `input_price_cny_per_million` | 正式计费字段 | ✅ |
| `output_price_cny_per_million` | 正式计费字段 | ✅ |
| `cost_amount_cny` | 正式单次花费 | ✅ |
| `total_cost_cny` | 正式累计花费 | ✅ |
| `selected_model_key` | 正式模型选择主键 | ✅ |
| `selected_platform` | 兼容层保留 | ⚠️ 废弃 |
| `selected_model` | 兼容层保留 | ⚠️ 废弃 |
| `*_usd` | 不再使用 | ❌ |

## 7. 新建表检查清单

- 是否使用了正确前缀
- 是否启用了 RLS
- Policy 是否使用 `(SELECT auth.uid())`
- 是否需要同步更新 `shared/src/types/database.ts`
- 是否需要同步更新共享文档和项目文档
- 是否使用了正确的计费字段（`*_cny` 而非 `*_usd`）

## 8. Phase 2/3/4 变更记录

| 变更 | 日期 | 说明 |
|------|------|------|
| AI 模型目录升级 | 2026-03-26 | 新增 `ai_model_families` + `ai_model_skus` 权威表 |
| CNY 计费升级 | 2026-03-26 | 新增 `input_price_cny_per_million` 等字段 |
| Usage 账本表 | 2026-03-26 | `ss_ai_usage_events` + `ss_ai_usage_minute` |
| 知识库表 | 2026-03-25 | `ss_kb_*` 系列表 + pgvector |
| Phase 4 完成 | 2026-04-11 | 节点系统单一事实源 + Agent 样板完成 |
