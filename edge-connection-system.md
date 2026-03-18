# Edge Connection System — 节点连线机制

## Goal
为 workflow 画布实现完整的 3 种连线类型（顺序/条件/循环），支持拖拽+点击双模式建连、磁吸吸附、端点重连、连线选中/删除/右键菜单、双击编辑标签、循环线自动生成循环块。

## 确认的设计决策

| 决策 | 结论 |
|------|------|
| 连线类型 | 3 种: sequential (实心) / conditional (虚线+标签) / loop (波浪) |
| 并行 | 不需要独立类型，多条顺序线自然表达 |
| 建连方式 | 拖拽 + 点击双模式，拖拽自动磁吸 |
| 端点操作 | 点击后可自由拉伸、reconnect 到其他 Handle |
| 多条线 | 同一节点对 (A→B) 允许多条不同/同类型线 |
| 标签编辑 | 双击编辑 + 右键菜单编辑 (文本编辑框) |
| 选中行为 | 点击/框选/多选，与节点一致 |
| 删除 | Delete 键 / 右键菜单 / 线上×按钮 |
| 循环块 | 波浪线连接后自动生成虚线循环区域块，支持自由拖拽+删除 |
| 面板关闭 | 仅 ×按钮 / 再点编辑按钮 |

## Tasks

### Phase 1: 类型基础 + Handle 改造

- [ ] **T1.1** 扩展 `types/workflow.ts` — 新增 `EdgeType` 联合类型，扩展 `WorkflowEdge` 增加 `type`, `sourceHandle`, `targetHandle`, `data.label`, `data.branch` 字段
  → Verify: TS 编译通过，无类型错误

- [ ] **T1.2** 改造 `AIStepNode.tsx` — 从 2 Handle 改为 8 Handle (4 方位×2 类型)，每个 Handle 有唯一 ID (`source-top`, `target-left` 等)，默认仅 hover 时显示
  → Verify: 节点 hover 时 4 方位 Handle 淡入可见，移出淡出

- [ ] **T1.3** 修改 `use-workflow-store.ts` — 新增 `activeEdgeType: EdgeType` 状态 + `setActiveEdgeType` action，修改 `onConnect` 使新建 edge 自动注入当前选中的 `activeEdgeType` 和 Handle ID
  → Verify: 切换 activeEdgeType 后建连，edge 的 type 字段正确

- [ ] **T1.4** 老数据兼容 `normalizeEdge()` — 在 `setCurrentWorkflow` 中对旧 edges 补充默认值 (`type: 'sequential'`, `sourceHandle: 'source-right'`, `targetHandle: 'target-left'`)
  → Verify: 加载旧工作流不报错，连线正常渲染

### Phase 2: 三种 Edge 渲染组件

- [ ] **T2.1** 新建 `SequentialEdge.tsx` — 改良 AnimatedEdge，实心 pencil 笔触 + 箭头，选中态加粗高亮
  → Verify: 顺序线以实心手绘风格渲染

- [ ] **T2.2** 新建 `ConditionalEdge.tsx` — 虚线 (`stroke-dasharray: 8 5`) + amber 色系 + EdgeLabelRenderer 渲染标签小纸条
  → Verify: 条件线显示虚线 + 标签

- [ ] **T2.3** 新建 `LoopEdge.tsx` — 波浪 SVG path (正弦偏移) + emerald 色系 + 回旋箭头
  → Verify: 循环线以波浪风格渲染

- [ ] **T2.4** 注册 edgeTypes + 更新 `workflow.css` — 在 WorkflowCanvas 注册 `{ sequential: SequentialEdge, conditional: ConditionalEdge, loop: LoopEdge }`，新增 `.conditional-edge-*` `.loop-edge-*` CSS 类
  → Verify: 三种类型连线各有正确视觉

### Phase 3: 编辑按钮 → 连线面板 + ReactFlow 配置

- [ ] **T3.1** 新建 `EdgeTypePanel.tsx` — 3 种连线卡片 (线型预览+名称+描述)，手绘笔记风格，关闭仅限 ×/再点编辑按钮
  → Verify: 面板正确弹出，点击画布不关闭

- [ ] **T3.2** 改造 `FloatingToolbar.tsx` — 编辑按钮 toggle EdgeTypePanel，选中类型后编辑按钮高亮 active
  → Verify: 点击编辑按钮弹出/关闭面板

- [ ] **T3.3** 配置 ReactFlow 交互 props — 添加 `edgesReconnectable={true}`, `reconnectRadius={25}`, `onReconnect`, `onReconnectEnd`, `onEdgeClick`, `onEdgeContextMenu`
  → Verify: 连线端点可拖拽重连，靠近 Handle 自动吸附

### Phase 4: 连线交互 (选中/编辑/删除/右键)

- [ ] **T4.1** 连线选中视觉 — 在三种 Edge 组件中处理 `selected` prop: 加粗、高亮、显示端点把手和 × 删除按钮
  → Verify: 点击连线出现选中效果

- [ ] **T4.2** 新建 `EdgeContextMenu.tsx` — 右键菜单: 编辑标签 / 更改类型(子菜单) / 反转方向 / 删除
  → Verify: 右键连线弹出菜单，各功能可用

- [ ] **T4.3** 连线标签双击编辑 — EdgeLabelRenderer 内双击文本 → 切换为 `<input>` 内联编辑 → 失焦或 Enter 保存到 `edge.data.label`
  → Verify: 双击标签可编辑，保存后持久化

- [ ] **T4.4** 连线删除 — Delete/Backspace 键删除选中连线，右键菜单删除，× 按钮删除
  → Verify: 三种删除方式均正常

### Phase 5: Click-to-Connect + 循环块

- [ ] **T5.1** Click-to-connect 状态机 — 在 store 新增 `clickConnectState`，Handle onClick 处理: 首次点击选源 → 二次点击选目标 → 创建连线 → Escape 取消
  → Verify: 点击源 Handle → 点击目标 Handle → 成功建连

- [ ] **T5.2** 循环块自动生成 — 创建 loop 类型边后，自动检测循环体内的节点，生成虚线边框的 group annotation，可自由拖拽和右键删除
  → Verify: 波浪线连接后出现循环区域标记块

- [ ] **T5.3** Handle 智能显隐完善 — 拖拽连线中显示目标节点所有 target Handle (高亮)，点击连接模式中源 Handle 脉冲动画
  → Verify: 拖拽时目标 Handle 自动亮起

### Phase 6: 验证

- [ ] **T6.1** 全流程冒烟测试 — 创建包含三种连线的工作流，保存/刷新后数据完整恢复，撤销/重做正常
- [ ] **T6.2** 执行验证 — 运行包含条件分支的工作流，后端 `edge.data.branch` 正确路由
- [ ] **T6.3** 老数据兼容验证 — 加载现有工作流（无新字段），连线正常显示和操作

## 涉及文件

| 文件 | 操作 | Phase |
|------|------|-------|
| `types/workflow.ts` | 修改 | 1 |
| `stores/use-workflow-store.ts` | 修改 | 1,5 |
| `nodes/AIStepNode.tsx` | 修改 | 1 |
| `canvas/edges/SequentialEdge.tsx` | 新增 | 2 |
| `canvas/edges/ConditionalEdge.tsx` | 新增 | 2 |
| `canvas/edges/LoopEdge.tsx` | 新增 | 2 |
| `canvas/edges/AnimatedEdge.tsx` | 保留/重构 | 2 |
| `toolbar/EdgeTypePanel.tsx` | 新增 | 3 |
| `toolbar/FloatingToolbar.tsx` | 修改 | 3 |
| `canvas/WorkflowCanvas.tsx` | 修改 | 3,4 |
| `canvas/EdgeContextMenu.tsx` | 新增 | 4 |
| `styles/workflow.css` | 修改 | 2,4 |

## Done When
- [ ] 3 种连线类型可正常创建、显示、编辑、删除
- [ ] 拖拽和点击双模式建连均可用
- [ ] 连线端点可自由拉伸重连，支持磁吸
- [ ] 双击/右键可编辑连线标签
- [ ] 循环线连接后生成循环块
- [ ] 老工作流数据兼容无损
- [ ] 后端执行不受影响（零改动）

## Notes
- 后端零改动！edges_json 是 JSONB，新增字段自动透传
- 循环块仅作视觉展示，暂不设立执行意义
- 并行通过多条顺序线自然表达，无需独立类型
