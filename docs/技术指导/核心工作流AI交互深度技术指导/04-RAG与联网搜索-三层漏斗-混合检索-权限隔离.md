# RAG 与联网搜索：三层漏斗、混合检索、权限隔离

## 1. 与 core 规划一致的检索分层

沿用你定义的三层漏斗：

1. 摘要层（高覆盖、低成本）
2. 向量层（语义召回）
3. 原文层（精确溯源）

## 2. 检索算法推荐（最适合当前项目）

采用 Supabase 官方路线：

- Semantic search（pgvector）
- Keyword search（Postgres FTS）
- Hybrid search（RRF 融合）

理由：
- 单纯语义检索会漏掉“精确术语命中”。
- 单纯关键词检索会漏掉“同义表达”。
- RRF 对两者融合更稳。

## 3. 索引与召回参数

- 向量索引：优先 HNSW（Supabase 文档推荐）。
- 关键词索引：GIN on `tsvector`。
- 初始参数建议：
  - summary_top_k=3
  - chunk_top_k=8
  - rerank_top_n=4

## 4. 权限隔离（必须项）

使用 RLS 控制可召回文档范围，不仅在应用层过滤。

- `document_sections` 的 select policy 绑定 `owner_id/workspace_id`。
- 检索 RPC 内仍应保留 tenant 条件，避免误用 service key 时越权。

## 5. 联网搜索对称处理

与知识库流程保持一致：

- 先摘要化（多源抓取后先压缩）
- 再按需展开原网页

这样能显著降低 token 与延迟，并保持回答可追溯。

## 6. 风险与对策

1. 向量维度不一致
- 对策：embedding 模型版本固定，升级时整库重建向量。

2. 热点查询压力大
- 对策：缓存 query embedding + 召回结果。

3. 召回质量波动
> ⚠️ **【API 路由规划已过时警告】**：下方关于 rerank 可选模型的说法已过时，最新全量 RAG 模型链路（含 `qwen3-vl-rerank` 等）请**严格参考 [API 统一路由规划 · 权威索引](../../Plans/daily_plan/API/README.md) 文档**！
~~- 对策：加入 rerank（百炼/方舟可选），并持续评估 Recall@K。~~
