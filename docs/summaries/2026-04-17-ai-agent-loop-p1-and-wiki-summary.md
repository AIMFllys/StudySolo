# AI Agent Loop P1 与消息渲染统一摘要

**日期**：2026-04-17  
**完成状态**：已完成  
**相关更新**：`docs/updates/2026-04-17-ai-agent-loop-p1-and-wiki.md`

---

## 一句话总结

本轮把 StudySolo 侧栏 AI 从“能跑 Agent”推进到“默认轻、需要时才启用工具、消息渲染一致、reasoning 不污染历史”的状态，并同步补齐开发者 Token / MCP 入口与 API Wiki 文档。

---

## 关键成果

### 1. 普通聊天默认轻量

- 前端默认 `thinkingDepth` 改为 `fast`。
- 默认模型选择优先挑可访问、非 thinking 的聊天模型。
- 后端只有 `thinking_level === "deep"` 且未显式选择 SKU 时才强制 DeepSeek R1。
- 没有显式 SKU 的非 deep 聊天，优先走非 thinking `chat_response` 模型。

结果：普通聊天不再默认触发 R1，首 token 和输出长度更接近普通助手体验。

### 2. Agent Loop 不再劫持所有 chat

Agent Loop 启用边界收紧：

- `plan` / `create` 固定启用。
- 有 `canvas_context` 的 chat 启用。
- 命中工作流、画布、节点、连线、运行、状态、打开、重命名、新增、修改、删除、列出等关键词的 chat 启用。
- 无画布、无工具意图的纯闲聊走 legacy lightweight stream。

结果：工具 schema 和 XML 协议 prompt 只在真正需要工具能力时加载。

### 3. Reasoning 历史污染被清理

- `llm/caller.py` 继续把 `<think>...</think>` 流给前端，用于 ThinkingCard。
- reasoning 文本和 wrapper 不再进入 `LLMStreamResult.content`。
- `agent_loop.py` 在把 assistant 输出写回多轮 messages 前，二次剥离 `<think>` / `<thinking>` / `<reasoning>` 块。

结果：多轮 ReAct 上下文不再被 R1 reasoning 滚雪球式放大，同时保留前端可见的思考折叠体验。

### 4. AIMessage 渲染统一

新增 `chat-message-adapter.ts`，把两类输入收敛为统一 render model：

- legacy `content`
- agent `segments`

统一后的外壳负责：

- StudySolo AI header
- streaming loading
- `PlanCard`
- `AgentSegments`
- `[SUGGEST_MODE]` chip
- `summary` 渲染入口

结果：普通聊天、R1 thinking、Agent ToolCall、PlanCard、Summary 和建议模式 chip 不再像两套产品。

### 5. 画布 Agent 兼容性继续补齐

- 未知节点类型兜底到可渲染类型。
- `UPDATE_NODE` 只合并白名单字段，避免整节点覆盖。
- Plan 执行中 label anchor 可反查 node id。

结果：降低“节点变文字块”“UPDATE 误覆盖”“PlanCard 用 label 当 node id”等旧问题复发概率。

### 6. 开发者入口与 Wiki 同步

- 侧栏 WalletPanel 中加入开发者 Token 管理与 MCP 配置示例。
- `DeveloperTokens` 支持 `compact` 模式，适配窄侧栏。
- Wiki 新增 API 参考分组：CLI、MCP Host、Agent Skills。
- Wiki 导航从 emoji 改为 Lucide 图标，页面结构更稳定。

---

## 验证重点

后端：

- 纯闲聊不走 Agent Loop。
- `plan/create`、画布上下文和工具关键词 chat 走 Agent Loop。
- reasoning 可流式展示，但不进入结果 content。
- Agent history append 前会剥离 reasoning，保留 answer/tool/summary XML。

前端：

- 默认聊天状态为 `fast`。
- 默认模型选择优先非 thinking 模型。
- legacy content 与 segments 都能提取 `[SUGGEST_MODE]`。
- 中文样例“工作流 / 节点 / 本轮变更”在 adapter 测试中保持原样。

---

## 已落地提交

- `a84adbe feat: add AI agent loop backend`
- `2c420fe feat: unify AI chat streaming UI`
- `8f51153 feat: surface developer token setup`
- `80fdfeb feat: add API wiki documentation`
- `2bc9bdc test: tighten frontend type coverage`

---

## 后续建议

1. 做 P1-E：selected SKU 与 reasoning capability 的语义收口。
2. 补一轮 Agent 工具手工回归：工作流列表、打开、重命名、画布 CRUD、后台运行、状态查询。
3. 为 API Wiki 增加错误码、截图和最小可运行示例。
4. MCP / CLI 下一阶段推进 HTTP / SSE transport、细粒度 scopes、run pause / resume / cancel。
