# StudySolo AI 工作流生成架构修复总结

## 概述

本次优化彻底解决了 StudySolo 项目里“AI 生成工作流”在 `BUILD`（全量生成）和 `MODIFY`（增量修改）阶段展现出的结构缺陷、UI 坐标堆叠以及组件空白等关键性问题。通过本次修订，打通了自提示词定义层（Prompt）、后端调度层（Backend Processor）到前端响应层（Frontend Executor）的全链路一致性。系统现已能够强劲、规整、无死角地生成符合逻辑的 AI 执行拓扑图。

## 核心架构修复与升级

### 1. 结构完整性：强制注入入度根节点 (`trigger_input`)
- **根因分析**：AI 在构建工作流架构阶段（Planner）并未将 `trigger_input` 视为可选或必须的起步节点，导致整个工作流图缺乏执行引擎所需的起点（无入度为 0 的节点）。
- **提示词约束强化**：将 `trigger_input` 作为特权基础节点补充进 `models/ai.py` 中的 `Planner Prompt`，并通过强调（“⚠️ 必须作为第1个节点”）指导 AI 为新图生成合法的输入依赖。
- **后端兜底注入**：在 `api/ai.py` 内部 `_generate_workflow_core()` 中实现了拦截型后处理补偿（Fallback Injection）。在构建 `enriched_nodes` 后，系统会严格校验。若 AI 未能生成 `trigger_input`，则自动生成，并将其对接至所有真实入度为 0 的业务节点，实现拓扑图逻辑闭环。

### 2. UI 渲染体验：强制执行拓扑排序排版 (Auto Layout)
- **堆叠现象消除**：由于 LLM 输出的 XY 坐标极具不可预测性（经常复读 `0,0` 或是直线排布），原逻辑中基于“坐标是否有效/碰撞”推断排布的防守函数 `_should_auto_layout` 存在误判盲区。
- **架构决断**：废弃 `_should_auto_layout`。对由大模型产生的拓扑结构图，**始终执行**确定性的层次拓扑排版算法 `_auto_layout_nodes`。该算法以确定的流向（例如每层横向加 340px，每行垂直加 220px）展开图形，彻底保障任何规模生成的界面清晰、节点分布散列。

### 3. 数据层一致性：NodeType 枚举扩容与类型守护
- **前后端类型断层修复**：在 `models/ai.py` 中，将只存在于早期设计版本的 9 种 `NodeType` 扩容至 18 种系统现存类型。这些类型包含但不限于 P1/P2 阶段新增的（如 `compare`、`mind_map`、`quiz_gen`、`merge_polish`、`logic_switch` 等）所有业务模型体系，使前后端类型的定义重新处于同一共识标准之下。
- **System Prompts 同步注册**：为新引入的基于 LLM 计算能力的节点同步注册了专属的基础元提示词（`SYSTEM_PROMPTS`），避免由于找不到对应任务执行策略导致的下游链路中断。

### 4. 前端执行器稳定性：ADD_NODE 拦截网
- **拒绝空白/未知节点**：用户使用文字命令动态 ` MODIFY` 图结构时，AI 可能捏造系统内尚不存在的 `type`。在 `use-action-executor.ts` 的 `ADD_NODE` 处理流程中，引入了来自前端单点数据源（`NODE_TYPE_META`）的严格守门验证。
- **降级保护**：当 `action.payload.type` 未知时，系统将通过主动抛出异常或记录提示来禁止落盘，避免在 React Flow 画布中挂载无 UI 控制器的“幽灵/空白”节点，守护画板的纯净度。

## 涉及文件范围

- `backend/app/models/ai.py`：类型枚举扩容、更新 Planner 提示词。
- `backend/app/api/ai.py`：后处理入度注入，禁用推断、实施全面 Auto Layout 强制布局。
- `backend/app/prompts/ai_chat_prompts.py`：补齐 MODIFY 意图所需认识的完整节点知识。
- `frontend/src/features/workflow/hooks/use-action-executor.ts`：前端画布守护，ADD action 类型封锁。

## 未来建议

1. **节点连线复原校验**：在 `trigger_input` 未成功自动挂载时，引入针对连线 `edges` 回环检验（Cycle Detection），在执行画布变动序列前防止死锁。
2. **多终端适配排版**：可以基于画布的可视口宽度调整 `_auto_layout_nodes` 梯队深度，优化超出视区（Overflow）时的平铺结构。

*完成日期*：2026年3月。
*目标*：完成 StudySolo AI 工作流生成的健壮性提升。
