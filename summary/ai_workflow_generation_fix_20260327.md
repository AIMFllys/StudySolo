# AI 工作流生成核心问题修复总结

**日期**: 2026-03-27
**修复范围**: 后端 AI 生成逻辑 (Backend)、前端节点执行逻辑 (Frontend)

## 1. 修复的核心问题

1. **[Critical] 缺少 `trigger_input` 节点** 
   - 现象：AI `BUILD` 意图生成的工作流没有输入节点，导致引擎无法找到起点。
   - 修复：更新 `Planner Prompt` 强调强制生成 `trigger_input`，且如果在返回中检测不到，后端算法会自动在位置最前方注入一个 `trigger_input` 并连接所有无入度（根）节点。
2. **[Major] 生成节点 UI 坐标堆叠**
   - 现象：AI 返回的 position（如全部为 `{x:0, y:0}` 或共线）导致 UI 严重堆叠，难以修改。
   - 修复：移除 `_should_auto_layout` 判断，**强制始终执行拓扑排序算法进行自动布局 (`_auto_layout_nodes`)**，丢弃 AI 不可靠的坐标，确保画布上的工作流完美展开。
3. **[Major] `MODIFY` 时生成的空白节点问题**
   - 现象：用户通过聊天（如 "加个闪卡节点"）执行 `ADD_NODE` 时，生成了在当前执行引擎没有完整支持（如无对应的 system prompt 或 type 错误）的空白模块。
   - 修复：同步扩充 `NodeType` 枚举（9 种 -> 18 种），补齐 P1 和 P2 阶段的所有新节点；前端执行 `ADD_NODE` 动作时加入类型校验，严格拦截非白名单在册的节点。

## 2. 修改文件清单

| 文件路径 | 对应修改内容 |
|---------|------------|
| `backend/app/models/ai.py` | 扩充 `NodeType` 类型至 18 种，重写 `Planner Prompt` 新增关于 `trigger_input` 第一名的设定及对所有节点类型的使用指导，并补齐全系提示词。 |
| `backend/app/api/ai.py` | 注入 `trigger_input` 强校验&补全算法，废弃 `_should_auto_layout` 并改为「始终重排」以规避 AI 自定义坐标出错带来的 UI 堆叠。 |
| `backend/app/prompts/ai_chat_prompts.py` | AI 分析阶段的 `IDENTITY_PROMPT` 中补齐 `trigger_input` 及遗漏类型的元信息说明，供 `MODIFY` 时使用。 |
| `frontend/src/features/workflow/hooks/use-action-executor.ts` | 增加防洪堤：`ADD_NODE` 动作强校验前端 `NODE_TYPE_META` 支持度，阻挡未注册类型的污染。 |

## 3. 部署和影响说明
本次属**纯逻辑修复**，并未打乱原有架构，也不影响老工作流结构的解析运行（因老工作流无节点增减等行为）。下一步建议在产品化后重点观测新生成或修改后的各新类型节点实际表现能力，保证节点逻辑通畅。
