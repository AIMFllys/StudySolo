# StudySolo AI 架构实现总结

## 概述

StudySolo 的 AI 聊天界面已成功完成重大架构升级，从单体、基于意图的系统转变为成熟的、模式驱动（Mode-driven）的框架（规划 Plan、对话 Chat、创建 Create），完全对齐了 Cursor 和 Antigravity 等工具设立的行业标准。这一现代化改造极大地增强了系统的可维护性、输出可靠性、推理能力以及整体扩展性。通过 MCP 机制直接集成用户的 Supabase 数据库，该工作流保证了精确且具备上下文感知能力的 AI 操作。

## 核心架构升级

### 1. 模块化模式驱动提示词系统
- **提示词外部化**：系统提示词已完全从 Python 字符串中抽象出来，存放在 `backend/app/prompts/` 下经过版本控制的 Markdown 文件中：
  - `identity.md`：全局人格配置。
  - `mode_plan.md`：用于架构规划的严格 XML 格式推理布局。
  - `mode_chat.md`：常规、对话式的 Markdown 配置，带有建议工作流模式切换的“轻微引导”（Soft nudge）协议。
  - `mode_create.md`：配置为输出整洁 `tool_calls` JSON 格式的直接操作框架。
  - `intent_classifier.md`：针对模棱两可的请求进行高速分类的提示词。
- **动态提示词加载器 (`prompt_loader.py`)**：实现了基于 LRU 缓存的变量注入引擎，能够将特定上下文（例如 `{{canvas_context}}`、`{{thinking_depth}}`）动态渲染到活跃的提示词中。

### 2. 多模式 API 路由（后端）
- 修改了 `ai_chat_stream.py`，严格基于 `AIChatRequest` 模型中新引入的 `mode: 'plan' | 'chat' | 'create'` 有效负载属性进行路由。
- **遵循输出协议**：
  - **规划 (Plan)** 模式强制执行针对 UI 解析优化过的结构化 `<plan>` XML 块。
  - **创建 (Create)** 模式输出 JSON 格式的 `tool_calls`，精确反映前端执行要求（`ADD_NODE`、`COPY_NODE` 等）。此前预期的 `actions` 格式在后端无缝转换（将带有 `tool` 和 `params` 的标准 `tool_calls` 映射到相应的 `operation` 和 `payload`）。

### 3. 前端执行与 GUI 增强
- **XML 解析生态**：引入了 `parse-plan-xml.ts`，部署了稳健的降级策略（DOMParser 失败则回退到正则，再失败则回退到原始 Markdown），确保 AI 的不可预测性不会导致 UI 解析中断。
- **“选择性应用”规划组件**：设计并原生集成 `PlanCard.tsx` 到 `ChatMessages.tsx` 中，将抽象的 XML `<plan>` 响应转化为交互式 UI，用户可以粒度化地挑选并执行（`选择性执行`）AI 建议的节点调整或连接。
- **Antigravity 风格的模式选择器**：将 `ChatInputBar.tsx` 的默认模式切换升级为精致的描述性下拉菜单，忠实模拟了 Antigravity 的结构化模式选择器布局（提供清晰的图标、大型文本标题以及针对 `规划`、`对话` 和 `创建` 模式的实用描述）。
- **轻微引导 (Soft Nudges)**：启用了对 `[SUGGEST_MODE:mode]` 标记的内联解析，当用户在“规划”模式下要求“修改”组件时，系统会弹出优雅的 UI 提示，引导用户流转上下文模式。
- **节点复制实现**：在 `useActionExecutor.ts` 中开发了深度复制能力（`COPY_NODE`），生成具有精确位置偏移（`max(X+340)` 规则）的稳健副本，在保留负载定义的同时主动重置操作状态（`pending`）。

## 开发脚本审计（“最终检查”）

所有更新均在 `checklist.py` 和 `lint_runner.py` 范围内持续评估，保证 100% 遵循零 Lint 严格程度和 `clean-code`（整洁代码）协议。

## 数据库与认证上下文（Supabase MCP 集成）

更新内容无缝连接了来自“前端 (Next.js/Vite)”的已认证用户状态，通过 fetch 命令直接使用 `credentials: 'include'` 与“后端 (FastAPI)”通信。工作流操作命令确保数据库写入根据会话上下文正确路由。所有系统表均保持与 Supabase 中指定模式相匹配的结构。

## 未来建议

1. 集成 `PlanCard` 指标追踪，观察“选择性应用”与“完全手动批准”的使用频率。
2. 推进 `COPY_NODE` 逻辑以追踪分组关系，如果引入复杂容器包装器（`loop_group` 风格逻辑），应通过递归遍历嵌入式子节点来实现。

*完成日期*：2026年3月。
*目标*：完成 StudySolo AI 聊天界面的模式驱动框架。
