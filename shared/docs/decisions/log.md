# 跨项目决策记录

> 最后更新：2026-03-26
> 文档编码：UTF-8（无 BOM） / LF

## 2026-03-26

### 决策 #005：共享层文档以代码和迁移为准

背景：

- 架构文档、README、项目级 skills 已出现版本滞后和同步关系混写

决策：

- 共享层与项目文档统一以源码、Pydantic 模型、迁移文件、`.gitmodules` 为事实源
- 停止维护脱离代码的手写架构快照

### 决策 #006：明确区分 submodule 与 subtree

背景：

- `shared/` 与 Platform 中 `StudySolo/` 的同步方式曾被混写

决策：

- `shared/` 在当前仓库中定义为 Git submodule
- Platform Monorepo 中的 `StudySolo/` 定义为 git subtree
- 所有共享文档都必须同时写明两者差异

### 决策 #007：AI 模型目录以 family + SKU 为权威

背景：

- 旧的 `ai_models` 已不足以表达路由、展示、分 tier 控制与 CNY 计费

决策：

- 新目录权威表为 `ai_model_families` + `ai_model_skus`
- `selected_model_key` 成为正式主入口
- `ai_models` 保留兼容层角色

### 决策 #008：usage 与计费正式口径统一为 CNY

背景：

- usage ledger 从 USD 兼容层过渡到 CNY 主口径

决策：

- 新接口、图表、文档以 `*_cny` 为正式字段
- `*_usd` 仅保留兼容与历史迁移语义
