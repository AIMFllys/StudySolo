# 新增 AI 模型 SOP

> 最后更新：2026-03-26
> 编码要求：UTF-8

本文档定义 StudySolo 当前新增 AI 模型的标准流程。后续新增模型、补价格、切平台、补后台展示时，必须按本文执行，避免出现“能调但不计费”或“能展示但路由错误”的问题。

## 1. 先判断模型属于哪一类

新增模型前，先做分类，不允许上来直接写配置。

### 1.1 便宜模型

满足以下特征时，优先归到便宜模型：

- 原生 API 本身就便宜
- 日常调用量大
- 没必要经过聚合平台加价

默认策略：

- `routing_policy = native_first`

### 1.2 贵模型

满足以下特征时，优先归到贵模型：

- 原生价格高
- 聚合平台可能更划算
- 需要平台级容灾

默认策略：

- `routing_policy = proxy_first`
- 默认链：`qiniu -> siliconflow -> native`

### 1.3 工具模型

满足以下特征时，归到工具模型：

- 不属于普通聊天 / 推理模型
- 能力强依赖特定平台

当前典型：

- OCR
- Search

默认策略：

- `routing_policy = capability_fixed`

## 2. 明确 6 个核心字段

新增模型时，必须先确定以下字段。

- `provider`
  实际调用平台
- `vendor`
  模型原始厂商
- `model_id`
  真实 API 请求值
- `family_id`
  逻辑模型族
- `sku_id`
  平台级 SKU 主键
- `billing_channel`
  `native` / `proxy` / `tool_service`

示例：

- `provider = qiniu`
- `vendor = qwen`
- `model_id = Qwen3-Max`
- `family_id = qwen_premium`
- `sku_id = sku_qiniu_qwen3_max_proxy`
- `billing_channel = proxy`

## 3. 核验价格来源

新增模型前必须确认价格来源。

允许的价格来源：

- 官方定价页
- 官方 API 文档
- 平台模型广场公开价格
- 项目内已确认的供应商报价文档

必须记录：

- `price_source`
- `pricing_verified_at`

如果价格未确认：

- 不允许乱填
- 统一写 `Pricing pending: ...`
- 价格先填 `0`
- 在后台可展示，但必须清楚标记

## 4. 建立模型族

如果该模型所属逻辑族还不存在，需要先在 `ai_model_families` 建档。

至少填写：

- `id`
- `vendor`
- `family_name`
- `task_family`
- `routing_policy`
- `description`
- `is_enabled`

示例：

- `deepseek_budget_chat`
- `qwen_premium`
- `zhipu_ocr`

## 5. 建立平台级 SKU

随后在 `ai_model_skus` 新增具体平台条目。

必须填写：

- `id`
- `family_id`
- `provider`
- `model_id`
- `display_name`
- `billing_channel`
- `required_tier`
- `is_enabled`
- `is_visible`
- `is_user_selectable`
- `is_fallback_only`
- `supports_thinking`
- `max_context_tokens`
- `input_price_cny_per_million`
- `output_price_cny_per_million`
- `price_source`
- `pricing_verified_at`
- `sort_order`

注意：

- 同一个 vendor 模型在不同 provider 下必须建不同 SKU
- 不允许复用旧 SKU 改 provider

## 6. 补运行时路由

如果新模型需要进入实际调用链，还要更新 `backend/config.yaml`。

根据分类决定：

- 便宜模型：放入 `native_first` 路由链
- 贵模型：放入 `proxy_first` 路由链
- 工具模型：放入 `capability_fixed` 对应任务链

当前重点检查：

- `providers`
- `task_routes`
- 环境变量兼容别名

## 7. 环境变量与平台接入

如果新增的是新平台，不只是新模型，还必须检查：

- `base_url`
- `api_key`
- 旧变量兼容别名
- 本地 `.env`
- 部署环境 Secret

原则：

- 运行时连接信息留在 YAML / env
- 不写进业务目录表

## 8. 前端目录与后台目录

新增模型后，不需要再手工往前端硬编码常量里补正式模型来源。

应确认：

- 用户侧读取 `/api/ai/models/catalog`
- 后台侧读取 `/api/admin/models/catalog`
- 后台模型页能看到该 SKU

只有开发兜底常量允许保留少量 fallback 模型，不作为正式来源。

## 9. 联调验收

新增模型后至少做一次真实调用联调。

必须检查：

1. 前端是否能看到模型
2. 选择模型后是否成功发起请求
3. 后端是否正确解析 `selected_model_key`
4. `ss_ai_usage_events` 是否写入正确：
   - `provider`
   - `vendor`
   - `model`
   - `sku_id`
   - `family_id`
   - `billing_channel`
5. `cost_amount_cny` 是否正确
6. 后台 model breakdown 是否出现该 SKU

## 10. 特殊情况处理

### 10.1 仅 fallback 使用

如果模型只作为灾备模型：

- `is_fallback_only = true`
- `is_user_selectable = false`
- `is_visible` 视业务决定

### 10.2 用户不可直选

如果模型只供系统内部路由，不给用户选：

- `is_user_selectable = false`

### 10.3 价格未确认

如果价格未确认：

- 允许先接入
- 但必须标记 `Pricing pending`
- 后台成本可能先显示为 `0`

## 11. 提交前检查清单

新增模型提交前，逐项确认：

- 已分类为便宜 / 贵 / 工具模型之一
- `provider`、`vendor`、`model_id` 明确
- `family_id` 已存在或已新增
- `sku_id` 已新增
- 价格来源已记录
- `config.yaml` 路由已接线
- 环境变量已准备
- 真实请求已联调
- usage 账本已写入正确字段
- 后台模型目录已可见
- 文档已更新

## 12. 一句话原则

新增模型不是只改一处配置，而是必须同时完成：

- 分类
- 建档
- 定价
- 路由
- 联调
- 文档同步
