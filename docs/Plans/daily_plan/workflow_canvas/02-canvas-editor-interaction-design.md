# 工作流画布编辑系统 · 全面设计文档

> 📅 创建日期：2026-02-27  
> 🔄 最新更新：2026-02-27  
> 📌 所属模块：Workflow Canvas · 工作流画布编辑器  
> 🔗 关联文档：[画布同步策略](./01-editor-autosave-sync-strategy.md) · [节点分析](../core/节点分析.md) · [工作流AI交互规划](../core/工作流AI交互规划.md) · [项目深度功能规划](../../global/项目深度功能规划.md)

---

## 📑 目录

- [一、系统概述与目标](#一系统概述与目标)
- [二、节点可编辑机制](#二节点可编辑机制)
- [三、提示词编辑系统](#三提示词编辑系统)
- [四、节点拖拽与交互系统](#四节点拖拽与交互系统)
- [五、连线系统与磁吸效果](#五连线系统与磁吸效果)
- [六、编辑效果增强](#六编辑效果增强)
- [七、模型选择器与权限控制](#七模型选择器与权限控制)
- [八、工作流后台运行机制](#八工作流后台运行机制)
- [九、前端组件架构](#九前端组件架构)
- [十、状态管理设计](#十状态管理设计)
- [十一、后端 API 补充](#十一后端-api-补充)
- [十二、实施优先级与任务分解](#十二实施优先级与任务分解)

---

## 一、系统概述与目标

### 1.1 画布编辑器定位

工作流画布是 StudySolo 的**核心交互界面**。之前的设计（`01-editor-autosave-sync-strategy.md`）聚焦于"自动保存与同步策略"，本文档在此基础上大幅扩展，定义**用户可编辑**的完整交互机制。

> **核心目标：让用户可以像使用 Figma/Miro/ComfyUI 一样自由编辑工作流——拖拽节点、编辑提示词、拖动连线、选择模型——实现真正的"人在回路"。**

### 1.2 编辑能力总览

| 编辑维度 | 能力描述 | 优先级 |
|---------|---------|--------|
| **节点提示词编辑** | 用户可修改每个节点的 System Prompt 文字 | ⭐ P0 |
| **节点拖拽** | 自由拖拽节点位置，实时更新 position | ⭐ P0 |
| **连线拖拽** | 拖动连线创建/修改节点间的连接关系 | ⭐ P0 |
| **磁吸连接** | 拖拽靠近时自动吸附到最近的连接点 | ⭐ P0 |
| **模型选择** | 节点可选择不同模型（受会员等级限制） | ⭐ P0 |
| **节点增删** | 添加新节点 / 删除节点 | ⭐ P0 |
| **节点复制** | 复制已有节点（含配置） | ⭐ P1 |
| **批量操作** | 框选多个节点批量移动/删除 | ⭐ P1 |
| **撤销/重做** | Ctrl+Z/Ctrl+Y 操作历史 | ⭐ P1 |
| **缩放控制** | 画布缩放 + 小地图导航 | ⭐ P0 |
| **网格对齐** | 拖拽时可选的网格吸附 | ⬜ P2 |
| **节点分组** | 将多个节点归为一组 | ⬜ P2 |

### 1.3 与 @xyflow/react 的关系

所有编辑能力均基于 **@xyflow/react 12.x** 实现。@xyflow/react 原生提供了：

- ✅ 节点拖拽（`onNodeDragStop`）
- ✅ 连线创建（`onConnect`）
- ✅ 边的增删改
- ✅ 缩放平移（`fitView` / `zoomIn` / `zoomOut`）
- ✅ 小地图（`MiniMap`）
- ✅ 控制面板（`Controls`）
- ✅ 背景网格（`Background`）

需要自定义实现的：
- 🔧 磁吸效果（proximity connect）
- 🔧 自定义节点 UI（含提示词编辑）
- 🔧 模型选择器
- 🔧 撤销/重做系统

---

## 二、节点可编辑机制

### 2.1 节点编辑模式

每个节点有两种展示状态：

| 模式 | 触发方式 | 显示内容 | 交互 |
|------|---------|---------|------|
| **预览模式** | 默认状态 | 节点标题 + 执行状态 + 模型图标 + 输出预览 | 可拖拽 |
| **编辑模式** | 双击节点 / 点击编辑按钮 | 展开编辑面板（提示词 + 模型选择 + 参数调整） | 可编辑内容 |

### 2.2 节点预览模式 UI

```
┌──────────────────────────────────┐
│ ⚪ (连接点·输入)                  │
│                                  │
│  📋 生成 Hooks 知识大纲           │  ← 节点标题（可内联编辑）
│  ────────────────────────        │
│  🧠 qwen3-turbo    ✅ Done      │  ← 模型 + 状态
│                                  │
│  "# React Hooks 知识大纲         │  ← 输出预览（折叠，前3行）
│   ## 1. useState               │
│   ..."                          │
│                                  │
│  ✏️ 编辑  📋 复制  🗑️ 删除       │  ← 悬浮操作按钮（Hover 显示）
│                                  │
│ ⚪ (连接点·输出)                  │
└──────────────────────────────────┘
```

### 2.3 节点编辑模式 UI

双击节点后，节点展开为编辑面板（可以是内联展开或右侧抽屉 Drawer）：

```
┌──────────────────────────────────────────────────┐
│  ✏️ 编辑节点：大纲生成                              │
│                                                  │
│  ── 基本信息 ──                                   │
│  节点标题：[生成 Hooks 知识大纲___________]         │
│  节点类型：outline_gen (大纲生成)                   │
│                                                  │
│  ── System Prompt ──                             │
│  ┌──────────────────────────────────────────────┐│
│  │ 根据学习目标，生成层级分明的知识大纲。          ││
│  │                                              ││
│  │ 要求：                                        ││
│  │ 1. 大纲至少包含3个主要章节                     ││
│  │ 2. 每个章节列出核心知识点                      ││
│  │ 3. 按照从浅到深的逻辑排列                      ││
│  │                                              ││
│  │ 输出格式：Markdown 层级标题                    ││
│  └──────────────────────────────────────────────┘│
│  字数：138 / 2000                                 │
│                                                  │
│  ── 模型选择 ──                                   │
│  [🧠 qwen3-turbo          ▼]                    │
│                                                  │
│  ── 参数调整 ──                                   │
│  Temperature：      [0.7    ▼]                   │
│  Max Tokens：       [2048   ▼]                   │
│  Top P：            [0.9    ▼]                   │
│                                                  │
│  ── 输入变量 ──                                   │
│  topic：${上游节点输出.goal}                       │
│  context：${暗线全局上下文}  (自动注入)             │
│                                                  │
│  [重置为默认]   [取消]   [💾 保存修改]             │
└──────────────────────────────────────────────────┘
```

### 2.4 节点编辑数据流

```
用户修改 Prompt 文本
    │
    ▼
onBlur / onChange (防抖 500ms)
    │
    ▼
更新 Zustand store → nodes[nodeId].data.system_prompt
    │
    ├── 同步到 localforage (500ms 防抖)
    │
    └── 同步到 Supabase (3s 防抖)
        └── PUT /api/workflow/{id}
```

### 2.5 可编辑规则

| 属性 | 用户可编辑 | 说明 |
|------|-----------|------|
| `label` (标题) | ✅ | 内联编辑或编辑面板 |
| `system_prompt` | ✅ | 编辑面板中的文本区域 |
| `model_route` | ✅ | 模型选择器（受会员等级限制） |
| `temperature` | ✅ | 滑块 0-2 |
| `max_tokens` | ✅ | 下拉选择 |
| `top_p` | ✅ | 滑块 0-1 |
| `node_type` | ❌ | 节点类型创建后不可更改 |
| `input` (输入映射) | ❌ | 由连线关系自动推导 |
| `output` (输出格式) | ❌ | 由节点类型预定义 |
| `position` | ✅ | 拖拽自动更新 |

---

## 三、提示词编辑系统

### 3.1 设计理念

> **让用户可以精细控制每个节点的 AI 行为，同时提供合理的默认值降低使用门槛。**

### 3.2 提示词编辑器功能

| 功能 | 说明 | 实现方式 |
|------|------|---------|
| **语法高亮** | 对 Markdown 格式高亮显示 | 轻量级编辑器（CodeMirror 或纯 textarea + highlight） |
| **字数统计** | 实时显示字数 / 最大字数 | `content.length` 计算 |
| **变量占位符** | 支持 `${variable}` 语法标识输入变量 | 正则高亮 + 自动补全 |
| **重置为默认** | 一键恢复该节点类型的默认 Prompt | 从节点类型定义读取 |
| **Prompt 模板库** | 预设的高质量 Prompt 模板供选择 | P1 阶段实现 |
| **AI 辅助优化** | "帮我优化这段 Prompt" 按钮 | P2 阶段实现 |

### 3.3 默认提示词管理

每种节点类型都有预设的默认 System Prompt，存储在 `config.yaml` 中：

```yaml
# config.yaml 节点默认 Prompt 示例
node_defaults:
  outline_gen:
    system_prompt: |
      你是一位知识体系架构师。根据用户给出的学习目标，生成层级分明、逻辑清晰的知识大纲。
      
      要求：
      1. 大纲至少包含 3-5 个主要章节
      2. 每个章节列出 3-5 个核心知识点
      3. 按照从基础到进阶的逻辑排列
      4. 使用 Markdown 层级标题格式输出
    default_model: "qwen3-turbo"
    default_temperature: 0.7
    default_max_tokens: 2048

  content_extract:
    system_prompt: |
      你是一位深度知识提炼专家。根据给定的章节主题，深入提炼该部分的核心知识点。
      
      要求：
      1. 内容准确、有深度，适合深入学习
      2. 使用简洁清晰的语言
      3. 包含关键概念定义、原理解释、实际示例
      4. 输出 Markdown 格式
    default_model: "qwen3-turbo"
    default_temperature: 0.7
    default_max_tokens: 4096

  summary:
    system_prompt: |
      你是一位综合归纳专家。将多个知识片段进行综合归纳总结。
      
      要求：
      1. 提炼共性与差异
      2. 建立知识点之间的关联
      3. 生成思维导图式的总结
    default_model: "qwen3-turbo"
    default_temperature: 0.5
    default_max_tokens: 3072

  flashcard:
    system_prompt: |
      你是一位教育学专家。将知识点拆解为高质量的 Q&A 闪卡，用于记忆训练。
      
      要求：
      1. 每张卡片有一个精准的问题和简洁的答案
      2. 涵盖关键概念、公式、定义
      3. 按难度分级：easy / medium / hard
    default_model: "deepseek-v3.2"
    default_temperature: 0.6
    default_max_tokens: 2048
```

### 3.4 Prompt 修改的影响范围

```
用户修改某节点的 Prompt
    │
    ├── 影响范围：仅该工作流中的该节点实例
    │   └── 不影响其他工作流中同类型节点
    │
    ├── 恢复方式：点击"重置为默认"
    │   └── 从 config.yaml 节点默认值恢复
    │
    └── 持久化：修改保存到该工作流的 nodes_json JSONB 中
        └── 每个节点 data 中包含 custom_system_prompt 字段
```

---

## 四、节点拖拽与交互系统

### 4.1 拖拽行为定义

| 行为 | 触发方式 | 效果 | @xyflow/react API |
|------|---------|------|--------------------|
| **单节点拖拽** | 鼠标按住节点内容区拖动 | 节点随鼠标移动，实时更新 position | `onNodeDragStop` |
| **多节点拖拽** | 先框选/Ctrl+Click 多选，再拖动 | 所有选中节点同步移动 | `onSelectionDragStop` |
| **新节点拖入** | 从左侧工具栏拖入画布 | 创建新节点 | `onDrop` + `onDragOver` |
| **画布拖拽** | 鼠标按住空白区域拖动 | 画布平移 | `panOnDrag` (内置) |
| **画布缩放** | 滚轮 / 两指捏合 | 画布缩放 | `zoomOnScroll` (内置) |

### 4.2 节点工具栏（左侧面板）

```
┌──────────────────────┐
│  📦 节点库            │
│                      │
│  ── 触发器 ──         │
│  🔵 输入触发          │  ← 可拖入画布
│                      │
│  ── AI 处理 ──        │
│  🟢 大纲生成          │
│  🟢 知识提炼          │
│  🟢 总结归纳          │
│  🟢 闪卡生成          │
│  🟢 润色合并 (P1)     │
│                      │
│  ── 数据获取 ──       │
│  🟡 知识库检索 (P1)   │
│  🟡 联网搜索 (P1)     │
│                      │
│  ── 逻辑控制 ──       │
│  🟠 条件分支 (P1)     │
│  🟠 循环迭代 (P1)     │
│                      │
│  ── 输出 ──           │
│  🔴 回复用户          │
│  🔴 数据写入          │
│  🔴 文件导出 (P1)     │
└──────────────────────┘
```

**拖拽创建节点流程**：

```
用户从节点库拖拽「大纲生成」
    │
    ▼ onDragStart → 携带节点类型数据
    │
    ▼ onDragOver → 画布显示放置预览（半透明轮廓 + 吸附线）
    │
    ▼ onDrop → 根据鼠标位置计算 position
    │
    ▼ 创建新节点，使用该类型的默认配置
    │
    ▼ 更新 Zustand store → 触发自动保存
```

### 4.3 节点操作交互

| 操作 | 触发方式 | 效果 |
|------|---------|------|
| **选中** | 单击节点 | 高亮边框，显示连接点 |
| **多选** | Ctrl+Click / 框选 | 多个节点高亮 |
| **编辑** | 双击节点 | 进入编辑模式 |
| **删除** | 选中 + Delete键 / 右键菜单 | 删除节点及关联连线 |
| **复制** | Ctrl+C → Ctrl+V / 右键复制 | 复制节点（新 ID，偏移位置） |
| **右键菜单** | 右键点击节点 | 弹出上下文菜单 |

### 4.4 右键上下文菜单

```
┌──────────────────┐
│ ✏️ 编辑节点       │
│ 📋 复制           │
│ 📎 粘贴           │
│ ──────────────── │
│ ▶️ 单独运行此节点  │
│ 🔄 重置输出       │
│ ──────────────── │
│ 🔒 锁定位置       │
│ 📌 置顶           │
│ ──────────────── │
│ 🗑️ 删除           │
└──────────────────┘
```

---

## 五、连线系统与磁吸效果

### 5.1 连线交互

| 操作 | 触发方式 | 效果 |
|------|---------|------|
| **创建连线** | 从节点输出端口拖向另一节点输入端口 | 创建 edge |
| **删除连线** | 选中连线 + Delete / 右键删除 | 移除 edge |
| **重新连线** | 拖动已有连线的端点 | 修改连接关系 |
| **连线动画** | 工作流执行时 | 数据流向箭头动画 |

### 5.2 磁吸连接效果（Proximity Connect）

> @xyflow/react 12.x 原生提供 `connectionRadius` 属性设定磁吸半径。需在此基础上增强视觉反馈。

#### 磁吸行为定义

```
用户从节点 A 输出端口开始拖拽连线
    │
    ▼ 连线跟随鼠标移动（贝塞尔曲线实时预览）
    │
    ▼ 鼠标靠近节点 B 的输入端口
    │   │
    │   ├── 距离 > 80px：无反馈
    │   ├── 距离 50-80px：端口发光 + 放大效果（视觉提示"可连接"）
    │   └── 距离 < 50px：磁吸吸附 + 连线自动弹向端口 + 端口高亮
    │
    ▼ 松开鼠标
    │
    ├── 在磁吸范围内 → 自动创建连接
    └── 在磁吸范围外 → 连线消失
```

#### 磁吸配置

```typescript
// WorkflowCanvas.tsx 配置
<ReactFlow
  connectionRadius={50}          // 磁吸半径 50px
  connectionLineType="smoothstep" // 连线类型：平滑阶梯线
  connectionLineStyle={{
    stroke: 'var(--accent)',
    strokeWidth: 2,
    strokeDasharray: '5 5',      // 虚线样式
  }}
  snapToGrid={true}              // 开启网格吸附
  snapGrid={[20, 20]}            // 20px 网格
  fitView                        // 自动适配视窗
  minZoom={0.2}
  maxZoom={2}
>
```

### 5.3 连接点（Handle）设计

```typescript
// 自定义节点中的 Handle 配置
<Handle
  type="target"                   // 输入端口
  position={Position.Top}         // 位置：上方
  id="input"
  style={{
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--muted)',
    border: '2px solid var(--accent)',
    transition: 'all 0.2s ease',
  }}
  isConnectable={true}
/>

<Handle
  type="source"                   // 输出端口
  position={Position.Bottom}      // 位置：下方
  id="output"
  style={{
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--accent)',
    border: '2px solid var(--accent)',
    transition: 'all 0.2s ease',
  }}
  isConnectable={true}
/>
```

### 5.4 连接规则

| 规则 | 说明 |
|------|------|
| **不允许自连接** | 节点不能连接到自身 |
| **不允许重复连线** | 两个节点间同方向只能有一条连线 |
| **不允许环路** | 连线不能创建循环（DAG 约束） |
| **类型兼容检查** | 触发器只能连 Processing，Processing 可连 Processing/Action |
| **最大连接数** | 每个输入端口最多 5 条入边（支持多输入汇聚） |

### 5.5 连线样式

| 状态 | 样式 | 说明 |
|------|------|------|
| **静态** | 灰色实线 + 箭头 | 未执行状态 |
| **执行中** | 蓝色动画流（虚线移动） | 数据流向动画 |
| **完成** | 绿色实线 | 数据成功传递 |
| **错误** | 红色虚线 | 数据传递失败 |
| **预览** | 半透明虚线 | 正在拖拽创建连线时 |

---

## 六、编辑效果增强

### 6.1 网格对齐（Grid Snap）

```typescript
// 开启网格背景 + 对齐
<Background
  variant={BackgroundVariant.Dots}  // 点阵网格
  gap={20}
  size={1}
  color="var(--muted-foreground)"
/>

// 拖拽时自动对齐到 20px 网格
snapToGrid={true}
snapGrid={[20, 20]}
```

### 6.2 对齐辅助线（Alignment Guides）

当拖拽节点时，如果与其他节点的水平/垂直中心对齐，显示辅助线：

```
         ╎
    ┌────╎────┐         ┌──────────┐
    │  Node A ╎         │  Node C  │
    └─────────┘         └──────────┘
         ╎ ← 垂直对齐辅助线
    ┌────╎────┐
    │  Node B │  ← 正在拖拽
    └─────────┘
```

### 6.3 小地图（MiniMap）

```typescript
<MiniMap
  nodeStrokeColor={(node) => {
    switch (node.data?.status) {
      case 'running':  return '#3b82f6'; // 蓝色
      case 'done':     return '#22c55e'; // 绿色
      case 'error':    return '#ef4444'; // 红色
      default:         return '#94a3b8'; // 灰色
    }
  }}
  nodeColor={(node) => {
    switch (node.type) {
      case 'trigger_input':    return '#818cf8'; // 紫色
      case 'outline_gen':      return '#34d399'; // 绿色
      case 'content_extract':  return '#38bdf8'; // 蓝色
      default:                 return '#cbd5e1'; // 默认灰
    }
  }}
  maskColor="rgba(0,0,0,0.15)"
  position="bottom-right"
/>
```

### 6.4 快捷键系统

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Z` | 撤销 |
| `Ctrl + Shift + Z` / `Ctrl + Y` | 重做 |
| `Ctrl + C` | 复制选中节点 |
| `Ctrl + V` | 粘贴节点 |
| `Ctrl + A` | 全选节点 |
| `Delete` / `Backspace` | 删除选中节点/连线 |
| `Ctrl + S` | 强制保存（触发立即云端同步） |
| `Ctrl + +` / `Ctrl + -` | 放大 / 缩小画布 |
| `Ctrl + 0` | 适配全部内容到视窗 |
| `Space + Drag` | 画布拖拽（手型工具） |
| `Esc` | 退出编辑模式 / 取消选择 |

### 6.5 撤销/重做系统

```typescript
// stores/use-undo-store.ts
interface UndoStore {
  history: HistoryEntry[];      // 操作历史栈
  undoStack: HistoryEntry[];    // 撤销栈
  redoStack: HistoryEntry[];    // 重做栈
  maxHistory: 50;               // 最大历史长度

  pushAction: (action: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryEntry {
  type: 'node_add' | 'node_delete' | 'node_move' | 'node_edit' |
        'edge_add' | 'edge_delete' | 'batch';
  timestamp: number;
  before: { nodes: Node[]; edges: Edge[] };  // 操作前快照
  after: { nodes: Node[]; edges: Edge[] };   // 操作后快照
}
```

---

## 七、模型选择器与权限控制

### 7.1 模型选择器 UI

```
┌──────────────────────────────────────────┐
│  🧠 选择模型                              │
│                                          │
│  ── 推荐模型 ──                           │
│  ⭐ deepseek-v3.2   🟢 Free  93ms       │  ← 免费可选
│  ⭐ qwen3-turbo      🟢 Free  128ms      │  ← 免费可选
│                                          │
│  ── DeepSeek ──                          │
│  ✅ deepseek-v3.2    🟢 Free             │
│  ✅ deepseek-r1      🟢 Free             │
│  ✅ deepseek-chat    🟢 Free             │
│                                          │
│  ── 通义千问 ──                           │
│  ✅ qwen3-turbo      🟢 Free             │
│  ✅ qwen3-plus       🟢 Free             │
│  🔒 qwen3-max       🟡 Pro              │  ← 免费版锁定
│                                          │
│  ── OpenAI ──                            │
│  🔒 gpt-4.1          💎 Pro              │
│  🔒 gpt-4.1-mini     💎 Pro              │
│  🔒 o4-mini          💎 Pro+             │
│                                          │
│  ── Anthropic ──                         │
│  🔒 claude-3.5-sonnet 💎 Pro             │
│  🔒 claude-3.5-haiku  💎 Pro             │
│  🔒 claude-4-sonnet   💎 Ultra           │
│                                          │
│  ── Google ──                            │
│  🔒 gemini-2.5-pro    💎 Pro+            │
│  🔒 gemini-2.5-flash  💎 Pro             │
└──────────────────────────────────────────┘
```

### 7.2 权限控制规则

> **核心原则：所有用户可以看到所有模型，但免费版只有 DeepSeek、部分通义千问模型可选择，其他模型显示锁定状态。**

#### 模型可用性矩阵

| 模型 | 免费版 | Pro 版 | Pro+ 版 | Ultra 版 |
|------|--------|--------|---------|----------|
| **deepseek-v3.2** | ✅ 可选 | ✅ | ✅ | ✅ |
| **deepseek-r1** | ✅ 可选 | ✅ | ✅ | ✅ |
| **deepseek-chat** | ✅ 可选 | ✅ | ✅ | ✅ |
| **qwen3-turbo** | ✅ 可选 | ✅ | ✅ | ✅ |
| **qwen3-plus** | ✅ 可选 | ✅ | ✅ | ✅ |
| **qwen3-max** | 🔒 锁定 | ✅ | ✅ | ✅ |
| **qwen3-long** | 🔒 锁定 | ✅ | ✅ | ✅ |
| **doubao-2.0-pro** | ✅ 可选 | ✅ | ✅ | ✅ |
| **gpt-4.1** | 🔒 锁定 | ✅ | ✅ | ✅ |
| **gpt-4.1-mini** | 🔒 锁定 | ✅ | ✅ | ✅ |
| **o4-mini** | 🔒 锁定 | 🔒 锁定 | ✅ | ✅ |
| **claude-3.5-sonnet** | 🔒 锁定 | ✅ | ✅ | ✅ |
| **claude-3.5-haiku** | 🔒 锁定 | ✅ | ✅ | ✅ |
| **claude-4-sonnet** | 🔒 锁定 | 🔒 锁定 | 🔒 锁定 | ✅ |
| **gemini-2.5-pro** | 🔒 锁定 | 🔒 锁定 | ✅ | ✅ |
| **gemini-2.5-flash** | 🔒 锁定 | ✅ | ✅ | ✅ |

> 🎓 **学生特权**：.edu 认证用户在免费版下，状态等同于 Pro 版模型权限。

### 7.3 锁定模型的交互

当免费用户点击锁定模型时：

```
┌──────────────────────────────────────┐
│  🔒 该模型需要 Pro 版会员             │
│                                      │
│  gpt-4.1 是 OpenAI 的旗舰模型，       │
│  推理能力更强，适合复杂任务。          │
│                                      │
│  💡 开通 Pro 版即可解锁！              │
│  首月仅需 ¥3                          │
│                                      │
│  [查看会员方案]      [继续使用免费模型] │
└──────────────────────────────────────┘
```

### 7.4 模型可用性 API

```typescript
// GET /api/models/available
// 返回当前用户可用的模型列表
{
  "models": [
    {
      "id": "deepseek-v3.2",
      "name": "DeepSeek V3.2",
      "provider": "deepseek",
      "is_available": true,
      "required_plan": "free",
      "avg_latency_ms": 93,
      "status": "healthy"
    },
    {
      "id": "gpt-4.1",
      "name": "GPT-4.1",
      "provider": "openai",
      "is_available": false,       // 免费用户不可用
      "required_plan": "pro",
      "avg_latency_ms": 1200,
      "status": "healthy"
    }
  ],
  "user_plan": "free"
}
```

---

## 八、工作流后台运行机制

### 8.1 设计目标

> **用户可以启动工作流后继续其他操作（切换页面、关闭画布），工作流在后台持续运行。当用户退出网站时，工作流自动停止。**

### 8.2 运行模式

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| **前台运行** | 用户停留在画布页面 | SSE 实时推送→画布节点动态更新 |
| **后台运行** | 用户离开画布/切换到其他页面 | 引擎持续执行，进度写入数据库 |
| **自动停止** | 用户关闭浏览器/退出网站 | 检测到连接断开→标记为 `suspended` |

### 8.3 后台运行技术方案

```
用户点击"▶ 运行工作流"
    │
    ▼
前端 → POST /api/workflow/{id}/execute
    │
    ▼
后端创建异步任务（AsyncIO Task / 任务队列）
    │
    ├── 执行引擎逐节点运行
    │   ├── 每个节点完成后更新 workflow_runs 状态
    │   └── 进度信息写入 workflow_runs.progress JSONB
    │
    ├── SSE 推送（如果前端在线）
    │   └── 前端监听 EventSource → 实时更新画布
    │
    └── 前端离开画布
        ├── SSE 连接断开
        ├── 引擎继续运行（后端异步任务不中断）
        └── 进度存入数据库
```

### 8.4 进度可视化（非画布页面）

#### 数据看板中的工作流进度

```
┌──────────────────────────────────────────┐
│  📊 数据看板                              │
│                                          │
│  ── 正在运行的工作流 ──                    │
│  ┌──────────────────────────────────────┐│
│  │ 🔵 "React Hooks 学习"               ││
│  │    进度：4/6 节点  ▪▪▪▪▪▪▪▪░░ 67%   ││
│  │    当前：知识提炼                     ││
│  │    耗时：2m 15s                      ││
│  │    [查看画布]  [暂停]                 ││
│  ├──────────────────────────────────────┤│
│  │ 🔵 "Python 设计模式研究"             ││
│  │    进度：1/4 节点  ▪▪▪░░░░░░░ 25%   ││
│  │    当前：大纲生成                     ││
│  │    耗时：45s                         ││
│  │    [查看画布]  [暂停]                 ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

#### 左侧导航栏的进度指示

```
┌──────────────────────────────┐
│  📁 我的工作流                 │
│                              │
│  📄 React Hooks 学习          │
│     🔵 运行中 (4/6) 67%      │  ← 进度条 + 状态
│                              │
│  📄 Python 设计模式           │
│     🔵 运行中 (1/4) 25%      │
│                              │
│  📄 数据结构复习              │
│     ✅ 已完成                  │
│                              │
│  📄 算法入门                  │
│     ⏸ 已暂停 (2/5)           │
│                              │
│  📄 机器学习基础              │
│     📝 草稿                   │
└──────────────────────────────┘
```

### 8.5 退出网站自动停止机制

> **核心约束：用户退出网站后，工作流自动停止，不继续消耗 Token。**

#### 技术方案

```
方案：心跳检测 + 超时自动暂停

前端
  │
  ├── 活跃状态
  │   └── 每 15 秒发送心跳 → POST /api/workflow/{id}/heartbeat
  │
  ├── 页面可见性变化（visibilitychange）
  │   ├── hidden → 发送最后一次心跳，标记 { status: 'background' }
  │   └── visible → 恢复正常心跳
  │
  └── 页面关闭（beforeunload）
      └── 发送 navigator.sendBeacon /api/workflow/disconnect
          └── 标记用户已断开

后端
  │
  ├── 心跳监控
  │   └── 每个运行中的工作流维护 last_heartbeat 时间戳
  │
  ├── 超时检测（后台定时任务，每 30 秒执行一次）
  │   └── 对于所有 status='running' 的工作流：
  │       ├── last_heartbeat 距今 > 60s → 标记 status='suspended'
  │       └── 通知执行引擎：当前节点完成后停止
  │
  └── 恢复机制
      └── 用户重新进入画布 → 检测到 suspended 工作流
          └── 弹窗提示："工作流因离线被暂停，是否继续？"
              ├── [继续执行] → 恢复引擎运行，从暂停节点继续
              └── [取消]     → 保持 suspended 状态
```

### 8.6 进度数据结构

```json
// workflow_runs 表中的 progress 字段
{
  "total_nodes": 6,
  "completed_nodes": 4,
  "current_node": {
    "id": "n4",
    "type": "content_extract",
    "label": "高级模式提炼",
    "status": "running",
    "started_at": "2026-02-27T00:05:32Z"
  },
  "node_results": {
    "n1": { "status": "done", "tokens_used": 1240, "duration_ms": 3200 },
    "n2": { "status": "done", "tokens_used": 2345, "duration_ms": 5600 },
    "n3": { "status": "done", "tokens_used": 2180, "duration_ms": 4800 },
    "n4": { "status": "running" }
  },
  "last_heartbeat": "2026-02-27T00:07:15Z",
  "total_tokens_used": 5765,
  "elapsed_ms": 135000
}
```

---

## 九、前端组件架构

### 9.1 组件目录

```
src/components/
  ├── workflow/
  │   ├── WorkflowCanvas.tsx         # React Flow 主画布容器
  │   ├── WorkflowToolbar.tsx        # 画布工具栏（缩放/撤销/运行）
  │   ├── NodeLibrary.tsx            # 左侧节点库面板
  │   ├── NodeEditor.tsx             # 节点编辑面板（右侧 Drawer）
  │   ├── ModelSelector.tsx          # 模型选择器组件
  │   ├── PromptEditor.tsx           # 提示词编辑器
  │   ├── WorkflowProgress.tsx       # 后台运行进度指示
  │   ├── nodes/
  │   │   ├── AIStepNode.tsx         # AI 处理节点（自定义）
  │   │   ├── TriggerNode.tsx        # 触发器节点
  │   │   ├── ActionNode.tsx         # 输出/动作节点
  │   │   ├── NodeMarkdownOutput.tsx # 节点内 Markdown 渲染
  │   │   └── NodeStatusBadge.tsx    # 节点状态标签
  │   └── edges/
  │       ├── AnimatedEdge.tsx       # 带动画的自定义连线
  │       └── EdgeContextMenu.tsx    # 连线右键菜单
  └── layout/
      └── Sidebar.tsx               # 含工作流进度的侧边栏
```

---

## 十、状态管理设计

### 10.1 Zustand Store 扩展

```typescript
// stores/use-workflow-store.ts（扩展版）
interface WorkflowStore {
  // ── 核心状态 ──
  nodes: Node[];
  edges: Edge[];
  currentWorkflowId: string | null;
  isDirty: boolean;

  // ── 编辑状态 ──
  selectedNodes: string[];
  editingNodeId: string | null;     // 当前编辑中的节点
  isNodeLibraryOpen: boolean;       // 节点库面板是否展开

  // ── 执行状态 ──
  executionStatus: 'idle' | 'running' | 'paused' | 'suspended' | 'completed' | 'error';
  executionProgress: ExecutionProgress | null;
  isBackgroundRunning: boolean;     // 是否后台运行

  // ── 操作 Actions ──
  // 节点操作
  addNode: (type: NodeType, position: XYPosition) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setEditingNode: (nodeId: string | null) => void;

  // 连线操作
  onConnect: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;

  // React Flow 事件
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // 执行控制
  startExecution: () => Promise<void>;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stopExecution: () => void;

  // 后台运行
  sendHeartbeat: () => void;
  fetchBackgroundProgress: () => Promise<void>;
}
```

---

## 十一、后端 API 补充

### 11.1 工作流执行 API 扩展

| Method | Path | 说明 |
|--------|------|------|
| `POST` | `/api/workflow/{id}/execute` | 启动执行（异步，返回 run_id） |
| `GET` | `/api/workflow/{id}/execute/sse` | SSE 流获取执行进度 |
| `POST` | `/api/workflow/{id}/pause` | 暂停执行 |
| `POST` | `/api/workflow/{id}/resume` | 恢复执行 |
| `POST` | `/api/workflow/{id}/stop` | 停止执行 |
| `POST` | `/api/workflow/{id}/heartbeat` | 心跳保活 |
| `POST` | `/api/workflow/disconnect` | 标记用户断开（sendBeacon） |
| `GET` | `/api/workflow/{id}/progress` | 获取后台运行进度 |
| `GET` | `/api/workflow/running` | 获取当前用户所有运行中的工作流 |

### 11.2 模型 API

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/models/available` | 获取当前用户可用模型列表（含锁定状态） |
| `GET` | `/api/models/all` | 获取所有模型列表（含健康状态） |

---

## 十二、实施优先级与任务分解

### Phase A — 画布核心编辑能力（P0·Phase 2 同步）

| # | 任务 | 验收标准 |
|---|------|---------|
| A1 | 自定义 AIStepNode 组件（双击编辑） | 双击进入编辑模式，ESC 退出 |
| A2 | PromptEditor 提示词编辑组件 | 可修改 Prompt 并保存 |
| A3 | 节点拖拽 + 磁吸连线 | 拖拽流畅，连线有磁吸效果 |
| A4 | ModelSelector 模型选择器（含权限） | 免费版只能选 DeepSeek/部分千问 |
| A5 | NodeLibrary 节点库（拖入创建） | 从左侧面板拖入新节点 |
| A6 | 右键上下文菜单 | 编辑/复制/删除/运行 |
| A7 | 快捷键系统（Ctrl+Z/C/V/Delete） | 撤销/复制/粘贴/删除正常 |

### Phase B — 后台运行与进度（P1）

| # | 任务 | 验收标准 |
|---|------|---------|
| B1 | 后端：异步执行引擎 + 心跳监控 | 工作流可后台运行，超时自动暂停 |
| B2 | 后端：进度 API + disconnect | 可查询后台进度，断开标记正常 |
| B3 | 前端：WorkflowProgress 进度组件 | 数据看板显示运行中工作流进度 |
| B4 | 前端：Sidebar 进度指示 | 左侧导航栏显示工作流状态+进度条 |
| B5 | 前端：心跳发送 + 断线恢复 | 退出自动停止，重进可恢复 |

### Phase C — 编辑增强（P1-P2）

| # | 任务 | 验收标准 |
|---|------|---------|
| C1 | 撤销/重做系统 | Ctrl+Z/Y 正常 |
| C2 | 框选多节点 + 批量操作 | 框选后可批量移动/删除 |
| C3 | 对齐辅助线 | 拖拽对齐时显示辅助线 |
| C4 | 连线动画（执行时） | 数据流向有动画效果 |
| C5 | 网格对齐精细控制 | 可开关网格吸附 |

---

> 📌 **文档关系**
>
> | 文档 | 定位 |
> |------|------|
> | **本文（画布编辑系统）** | 🎨 完整的画布编辑交互设计 |
> | `01-editor-autosave-sync-strategy.md` | 💾 自动保存与同步策略 |
> | `../core/节点分析.md` | 🧩 节点类型体系 + JSON Schema |
> | `../core/工作流AI交互规划.md` | 🔄 工作流执行 + 人机协同机制 |
> | `../../global/项目深度功能规划.md` | 🧭 项目全局规划总纲 |
