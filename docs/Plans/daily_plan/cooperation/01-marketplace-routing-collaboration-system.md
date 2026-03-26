# Marketplace 交互重构 + 双 URL 路由体系 + 协作机制 · 全面设计文档

> 📅 创建日期：2026-03-26
> 🔄 最新更新：2026-03-26
> 📌 所属模块：Workflow · Marketplace · Collaboration
> 🔗 关联文档：[workflow-backend-modernization](../../summary/2026-03-25-workflow-backend-modernization.md) · [项目架构全景](../../项目规范与框架流程/项目规范/项目架构全景.md) · [api.md](../../项目规范与框架流程/项目规范/api.md)
> ⚠️ 状态：✅ Phase 1-3 已完成（Phase 4 远期规划）

---

## 📑 目录

- [一、背景与动机](#一背景与动机)
- [二、当前状态盘点](#二当前状态盘点)
- [三、命题 1 — Marketplace 点击行为重构](#三命题-1--marketplace-点击行为重构)
- [四、命题 2 — 双 URL 路由体系设计](#四命题-2--双-url-路由体系设计)
- [五、命题 3 — `/s/[id]` 公开预览页增强](#五命题-3--sid-公开预览页增强)
- [六、命题 4 — `/c/[id]` 编辑画布路由创建](#六命题-4--cid-编辑画布路由创建)
- [七、命题 5 — 协作者机制完整设计](#七命题-5--协作者机制完整设计)
- [八、数据库设计](#八数据库设计)
- [九、后端 API 设计](#九后端-api-设计)
- [十、前端组件设计](#十前端组件设计)
- [十一、安全与边界 Case](#十一安全与边界-case)
- [十二、实施优先级与任务分解](#十二实施优先级与任务分解)
- [十三、验收标准](#十三验收标准)

---

## 一、背景与动机

### 1.1 问题总结

当前 Marketplace（工作流市场）存在以下体验和架构问题：

1. **点击即 Fork 的反模式**：用户在左侧样例面板中点击任何工作流，直接触发 `forkWorkflow(id)` 创建副本 → 用户还没看清就产生了数据垃圾
2. **路由体系不完整**：`/s/[id]`（公开预览页）已存在但 `/c/[id]`（编辑画布）尚未创建，画布编辑目前散布在 dashboard shell 内
3. **公开预览页徒有其表**：`/s/[id]` 仅展示节点/连线数量的占位文字，没有真正的画布渲染
4. **无协作机制**：`ss_workflows` 只有单 `user_id`，不支持多人协作

### 1.2 业界对标

| 产品 | 模板/市场点击行为 | 公开 URL | 编辑 URL | 协作 |
|------|-------------------|----------|----------|------|
| **GitHub** | 点击 → 详情页（README、Stars）→ Fork 按钮 | 同 URL（read） | 同 URL（push） | Collaborators 表 |
| **Figma** | 点击 → 预览页（评论、点赞）→ Duplicate | `/community/{id}` | `/design/{id}` | Team + Share |
| **n8n** | 点击 → 描述 + 节点概览 → "Use this template" | 模板预览页 | 编辑器 | — |
| **Notion** | 点击 → 预览/使用 → Duplicate | 同 URL | 同 URL | 邀请 + 权限 |
| **Google Docs** | — | 同 URL | 同 URL | 分享设置 |

**核心共识：**
- ✅ 100% 产品都是「先预览 → 再决定 Fork/复制」
- ✅ URL 不因 visibility 切换而变化（链接稳定性）
- ✅ 编辑入口和公开入口并行共存

### 1.3 设计原则

| 原则 | 说明 |
|------|------|
| **链接永不失效** | URL 一旦分享就不会因为 `is_public` 切换而断裂 |
| **先看后 Fork** | 用户必须充分了解工作流内容后才能做复制决策 |
| **权限与 URL 解耦** | 同一资源可以有多个入口，权限由后端统一判定 |
| **渐进式复杂度** | Phase 1 不引入协作，Phase 2 才加入，保持平滑演进 |
| **≤ 300 行/文件** | 严格遵守项目架构约束 |

---

## 二、当前状态盘点

### 2.1 现有文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `frontend/src/app/s/[id]/page.tsx` | ✅ 已有 | SSR 公开页，调用 `fetchPublicWorkflowForServer` |
| `frontend/src/app/s/[id]/PublicWorkflowView.tsx` | ✅ 已有 | 客户端组件，含 Like/Fav/Fork 按钮 |
| `frontend/src/app/s/[id]/layout.tsx` | ✅ 已有 | 精简顶栏布局 |
| `frontend/src/app/(dashboard)/workspace/page.tsx` | ✅ 已有 | 工作流列表页 |
| `frontend/src/app/c/[id]/` | ❌ 不存在 | 需要创建编辑画布路由 |
| `frontend/src/components/layout/sidebar/WorkflowExamplesPanel.tsx` | ✅ 已有 | 当前点击直接 Fork |
| `frontend/src/middleware.ts` | ✅ 已有 | 保护 `/c/*` 和 `/workspace/*` |
| `backend/app/api/workflow_social.py` | ✅ 已有 | marketplace / public / fork 端点 |
| DB: `ss_workflow_collaborators` | ❌ 不存在 | 需要创建 |

### 2.2 现有数据规模

| 指标 | 值 |
|------|-----|
| 总工作流数 | 12 |
| 公开工作流 | 2 |
| 协作者表 | 不存在 |

### 2.3 现有路由体系

```
已存在：
  /workspace           → 工作流列表（dashboard shell 内）
  /s/{id}              → 公开只读预览（独立布局）

需要创建：
  /c/{id}              → 编辑画布（独立全屏布局）

已废弃（有重定向）：
  /workspace/{uuid}    → 301 → /c/{uuid}
```

---

## 三、命题 1 — Marketplace 点击行为重构

### 3.1 当前行为 vs 目标行为

```
当前：
  用户点击样例卡片
    → forkWorkflow(id)          ← 直接 POST API 创建副本
    → router.push('/c/{newId}') ← 跳转到副本编辑页
    → 😡 用户还没看清就创建了垃圾数据

目标：
  用户点击样例卡片
    → router.push('/s/{id}')    ← 跳转到公开预览页
    → 用户查看完整内容
    → 决定 Fork → 点击 Fork 按钮 → 创建副本
    → 或者关闭 → 无副作用
```

### 3.2 改动范围

**文件：`WorkflowExamplesPanel.tsx`**

```diff
  // 卡片 onClick 行为
- onClick={() => handleFork(wf.id)}
+ onClick={() => router.push(`/s/${wf.id}`)}

  // 移除 forkingId 状态和 handleFork 函数
  // （Fork 由 /s/[id] 页面的按钮承担）
```

**精简后的组件职责：**
- 搜索 + 筛选 + 列表展示（保留）
- 点击导航到预览页（改动）
- ~~Fork 逻辑~~（移除，由 `/s/[id]` 承担）

### 3.3 卡片 UI 微调

```diff
  // 移除 "ArrowRight" 暗示 fork 的图标
  // 替换为 "Eye" 暗示预览的图标

- <ArrowRight className="..." />
+ <Eye className="..." />

  // 移除 "复制中..." loading 状态
- {forkingId === wf.id && (
-   <p className="...">复制中...</p>
- )}
```

---

## 四、命题 2 — 双 URL 路由体系设计

### 4.1 核心架构

```
┌─────────────────────────────────────────────────────┐
│                   StudySolo 路由体系                   │
├─────────────────────────────────────────────────────┤
│                                                       │
│   /c/{id}  ════  Canvas（编辑画布）                    │
│   ├── 需要登录                                         │
│   ├── 仅 owner + collaborator(editor) 可访问          │
│   ├── 完整编辑能力：拖拽、连线、执行、保存             │
│   └── 独立全屏布局（不在 dashboard shell 内）         │
│                                                       │
│   /s/{id}  ════  Share（公开预览）                     │
│   ├── 无需登录                                         │
│   ├── 仅 is_public=true 时可达，否则 404             │
│   ├── 只读画布渲染：查看节点和连线，但不可编辑         │
│   ├── 社交能力：Like / Favorite / Fork               │
│   └── 精简布局 + StudySolo 品牌顶栏                   │
│                                                       │
│   两者共存，互不影响，URLs 永不因 visibility 切换而变  │
└─────────────────────────────────────────────────────┘
```

### 4.2 完整权限矩阵

| 请求 URL | 用户身份 | `is_public` | 结果 |
|----------|----------|-------------|------|
| `/c/{id}` | Owner | 任意 | ✅ 编辑模式 |
| `/c/{id}` | Collaborator (editor) | 任意 | ✅ 编辑模式 |
| `/c/{id}` | Collaborator (viewer) | 任意 | ✅ 只读画布（可查看但不可编辑） |
| `/c/{id}` | 已登录但无权限 | 任意 | ❌ 403 "无权限访问此工作流" |
| `/c/{id}` | 未登录 | 任意 | → 重定向 `/login?redirect=/c/{id}` |
| `/s/{id}` | 任何人 | `true` | ✅ 只读预览 + 社交按钮 |
| `/s/{id}` | 任何人 | `false` | ❌ 404 "工作流不存在或未公开" |
| `/s/{id}` | Owner | `true` | ✅ 只读预览 + "✏️ 编辑此工作流" 入口 |

### 4.3 互引机制

```
┌─────── /c/{id} 编辑画布 ────────────────────────────────┐
│                                                           │
│  顶部工具栏：                                              │
│  [← 返回] [工作流名称] ... [邀请协作] [保存] [is_public?] │
│                                                           │
│  当 is_public=true 时，额外显示：                          │
│  🔗 "查看公开链接" → window.open('/s/{id}', '_blank')     │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌─────── /s/{id} 公开预览页 ──────────────────────────────┐
│                                                           │
│  顶栏：[StudySolo]             [公开工作流]              │
│                                                           │
│  当 visitor 是 owner 时，右上角额外显示：                  │
│  ✏️ "编辑此工作流" → router.push('/c/{id}')              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 4.4 `is_public` 切换行为

**关键决策：URL 不变，只改 DB 标志**

```
Owner 在 /c/{id} 顶栏点击 "公开/私有" 切换开关
  ↓
PUT /api/workflow/{id}  body: { is_public: true }
  ↓
is_public 标志变更成功
  ↓
/c/{id} 仍然可正常编辑（无变化）
/s/{id} 从 404 变为可访问（其他人可预览）
  ↓
顶栏显示 "🔗 查看公开链接" 按钮
```

---

## 五、命题 3 — `/s/[id]` 公开预览页增强

### 5.1 当前不足

```tsx
// PublicWorkflowView.tsx — 当前预览区域
<div className="rounded-lg border border-border bg-muted/30 p-8 min-h-[400px] flex items-center justify-center">
  <div className="text-center text-muted-foreground">
    <ExternalLink className="h-10 w-10 mx-auto mb-3 opacity-40" />
    <p className="text-sm font-medium">工作流预览</p>
    <p className="text-xs mt-1">
      共 {workflow.nodes_json.length} 个节点，{workflow.edges_json.length} 条连线
    </p>
  </div>
</div>
```

→ 只有文字占位，用户无法看到工作流实际长什么样。

### 5.2 增强方案 — 只读 Canvas 渲染器

**复用现有 Canvas 组件 + `readOnly` 模式：**

```tsx
// PublicWorkflowView.tsx — 增强后的预览区域
<ReadOnlyCanvas
  nodes={workflow.nodes_json}
  edges={workflow.edges_json}
  className="rounded-lg border border-border min-h-[500px]"
/>
```

**`ReadOnlyCanvas` 组件规格：**

| 能力 | 支持 |
|------|------|
| 渲染所有节点类型 | ✅ |
| 渲染所有连线 | ✅ |
| 缩放/平移 | ✅（鼠标滚轮 + 拖动） |
| 节点选中 | ❌ |
| 拖拽移动节点 | ❌ |
| 连线创建/删除 | ❌ |
| 节点编辑弹窗 | ❌ |
| 右键菜单 | ❌ |
| 画布工具栏 | 仅缩放控件 |

**实现思路：** 复用 ReactFlow 的 `<ReactFlow>` 组件，设置以下 props 禁用编辑：

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodesDraggable={false}
  nodesConnectable={false}
  elementsSelectable={false}
  panOnDrag={true}
  zoomOnScroll={true}
  nodeTypes={readOnlyNodeTypes}  // 复用现有 nodeTypes，移除编辑交互
  fitView
/>
```

### 5.3 增强后的完整页面结构

```
┌──────────────────────────────────────────────────────┐
│  StudySolo                                 公开工作流  │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ┌─── Header ──────────────────────────────────────┐  │
│  │  标题: "React Hooks 学习路径"                     │  │
│  │  描述: "从零开始掌握 React Hooks..."              │  │
│  │  作者: by 学习者小王  [官方] [精选]                │  │
│  │                                                    │  │
│  │  [❤️ 42] [⭐ 18] [🔀 Fork 到我的空间]            │  │
│  │                                                    │  │
│  │  标签: [React] [前端] [Hooks]                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─── ReadOnlyCanvas ─────────────────────────────┐  │
│  │                                                    │  │
│  │     [触发输入] ──→ [AI 分析] ──→ [大纲生成]       │  │
│  │                        │                            │  │
│  │                        ↓                            │  │
│  │                   [内容提取] ──→ [总结输出]         │  │
│  │                                                    │  │
│  │  🔍 [缩放控件]                                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─── 节点列表（折叠面板）──────────────────────────┐  │
│  │  1. 触发输入 (trigger_input)      描述...          │  │
│  │  2. AI 分析器 (ai_analyzer)       描述...          │  │
│  │  3. 大纲生成 (outline_gen)        描述...          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 六、命题 4 — `/c/[id]` 编辑画布路由创建

### 6.1 路由结构

```
app/
  c/
    [id]/
      page.tsx         ← 服务端组件（鉴权 + 数据获取）
      CanvasEditor.tsx  ← 客户端组件（编辑画布主体）
      layout.tsx        ← 全屏布局（无 sidebar/dashboard shell）
```

### 6.2 鉴权流程

```
用户访问 /c/{id}
    ↓
middleware.ts → 无 access_token cookie?
    ↓ 是
  redirect('/login?redirect=/c/{id}')
    ↓ 否（有 token）
page.tsx (Server Component)
    ↓
fetchWorkflowContentForServer(id, token)
    ↓
后端判定：owner? collaborator?
    ↓ 是
  渲染 <CanvasEditor workflow={data} accessRole="owner|editor|viewer" />
    ↓ 否
  → 403 页面（"你没有权限编辑此工作流"）
```

### 6.3 Phase 2 协作后的 `accessRole` 影响

| `accessRole` | UI 表现 |
|-------------|---------|
| `owner` | 完整编辑 + 邀请按钮 + 公开切换 + 删除 |
| `editor` | 完整编辑 + 保存，但无邀请/公开/删除 |
| `viewer` | 只读画布（同 ReadOnlyCanvas），无保存 |

---

## 七、命题 5 — 协作者机制完整设计

### 7.1 设计原则

| 原则 | 说明 |
|------|------|
| **Owner 至高权限** | 只有 owner 能删除工作流、切换公开、邀请协作者 |
| **Editor 可编辑** | Editor 可修改节点/连线/标签/描述，但不可改 visibility 和删除 |
| **Viewer 只读** | Viewer 可查看私有工作流（区别于 `/s/{id}` 公开只读） |
| **站内邀请** | Phase 1 只邀请已注册的站内用户（通过邮箱搜索） |
| **不占配额** | 被邀请协作的工作流不计入协作者的工作流数量配额 |

### 7.2 邀请流程

```
Owner 在 /c/{id} 点击 [邀请协作] 按钮
    ↓
弹出 Popover/Drawer
    ↓
输入被邀请人邮箱 → 搜索 user_profiles
    ↓ 找到
选择角色 (Editor / Viewer) → 点击 [邀请]
    ↓
POST /api/workflow/{id}/collaborators
    ↓
INSERT ss_workflow_collaborators (status='pending')
    ↓
被邀请人在侧边栏看到通知提示
    ↓
[接受] → status='accepted' → 工作流出现在"协作空间"
[拒绝] → status='rejected' → 通知消失
```

### 7.3 被邀请方体验

```
侧边栏底部出现提示 badge（或通知铃铛）
    ↓
展开通知：
  "张三 邀请你协作编辑《数学学习路径》"
  角色：可编辑
  [接受]  [拒绝]
    ↓ 接受
侧边栏工作流列表新增 "协作空间" 分组
  ┌── 协作空间 ──────────────────────┐
  │  📝 数学学习路径 (by 张三)        │  ← role=editor
  │  👁️ 英语词汇记忆法 (by 李四)     │  ← role=viewer
  └──────────────────────────────────┘
```

### 7.4 Sidebar 工作流分组调整

**当前**：

```
收藏 (is_favorited)
已发布 (is_public && !is_favorited)  
未分类 (!is_public && !is_favorited)
```

**引入协作后**：

```
我的工作流
  ├── ⭐ 收藏
  ├── 🌐 已发布
  └── 📄 草稿

协作空间（新增分组）
  ├── 📝 可编辑 (role=editor，按工作流 owner 分组)
  └── 👁️ 仅查看 (role=viewer)
```

**数据来源**：

| 分组 | API 来源 |
|------|----------|
| 我的工作流 | `GET /api/workflow`（现有，`user_id=me`） |
| 协作空间 | `GET /api/workflow/shared`（新增，从 `ss_workflow_collaborators` 查） |

### 7.5 编辑页顶栏布局

```
当 accessRole = "owner" 时：
┌────────────────────────────────────────────────────────────┐
│  ← 返回  │  📄 工作流名称 (可编辑)  │  [公开🔗] [邀请协作👥] [保存💾]  │
└────────────────────────────────────────────────────────────┘

当 accessRole = "editor" 时：
┌────────────────────────────────────────────────────────────┐
│  ← 返回  │  📄 工作流名称 (可编辑)  │  by Owner名字  │  [保存💾]  │
└────────────────────────────────────────────────────────────┘

当 accessRole = "viewer" 时：
┌────────────────────────────────────────────────────────────┐
│  ← 返回  │  📄 工作流名称 (只读)  │  by Owner名字  │  [Fork到我的空间🔀] │
└────────────────────────────────────────────────────────────┘
```

---

## 八、数据库设计

### 8.1 新增表 `ss_workflow_collaborators`

```sql
-- ═══════════════════════════════════════════════════
-- 工作流协作者表
-- 记录邀请关系、角色权限和接受状态
-- ═══════════════════════════════════════════════════

CREATE TABLE ss_workflow_collaborators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES ss_workflows(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'editor'
              CHECK (role IN ('editor', 'viewer')),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  
  -- 同一用户只能被邀请一次到同一个工作流
  UNIQUE (workflow_id, user_id)
);

-- 高频查询索引
-- 场景：进入 /c/{id} 时查该用户是否是协作者
CREATE INDEX idx_collab_workflow_accepted 
  ON ss_workflow_collaborators(workflow_id, user_id) 
  WHERE status = 'accepted';

-- 场景：侧边栏加载"协作空间"的所有工作流
CREATE INDEX idx_collab_user_accepted 
  ON ss_workflow_collaborators(user_id) 
  WHERE status = 'accepted';

-- 场景：查询用户的待处理邀请
CREATE INDEX idx_collab_pending
  ON ss_workflow_collaborators(user_id)
  WHERE status = 'pending';

-- RLS 策略
ALTER TABLE ss_workflow_collaborators ENABLE ROW LEVEL SECURITY;

-- 用户可以读取自己相关的协作记录
CREATE POLICY "user_read_own_collabs" ON ss_workflow_collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR invited_by = auth.uid()
  );

-- owner 可以 INSERT 协作者（通过 API 层校验 ownership）
-- 实际通过 service_role 操作，RLS 不影响后端
CREATE POLICY "service_manage_collabs" ON ss_workflow_collaborators
  FOR ALL USING (false); -- 前端不直接操作，仅后端 service_role

-- updated_at 自动更新触发器
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ss_workflow_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 8.2 ER 关系图

```
ss_workflows (主表)
  ├── id (PK)
  ├── user_id (FK → auth.users)   ← Owner
  ├── is_public
  ├── ...
  │
  ├── 1:N → ss_workflow_collaborators
  │          ├── workflow_id (FK → ss_workflows)
  │          ├── user_id (FK → auth.users)  ← Collaborator
  │          ├── role (editor / viewer)
  │          ├── status (pending / accepted / rejected)
  │          └── invited_by (FK → auth.users)
  │
  ├── 1:N → ss_workflow_interactions
  │          ├── workflow_id
  │          ├── user_id
  │          └── action (like / favorite)
  │
  └── 1:N → ss_workflow_runs
             ├── workflow_id
             └── user_id
```

---

## 九、后端 API 设计

### 9.1 权限判定核心函数

**文件：`backend/app/core/deps.py` — 新增 `check_workflow_access`**

```python
async def check_workflow_access(
    workflow_id: str,
    user_id: str,
    required_role: str,  # "viewer" | "editor" | "owner"
    db: AsyncClient,
) -> dict:
    """
    统一权限判定函数。
    
    返回: { "workflow": {...}, "access_role": "owner"|"editor"|"viewer" }
    异常: 404 (不存在), 403 (无权限)
    
    权限层级: owner(3) > editor(2) > viewer(1)
    """
```

### 9.2 协作者管理 API

| HTTP | 路径 | 功能 | 鉴权 | 说明 |
|------|------|------|------|------|
| `POST` | `/api/workflow/{id}/collaborators` | 邀请协作者 | Owner only | body: `{ email, role }` |
| `GET` | `/api/workflow/{id}/collaborators` | 获取协作者列表 | Owner + Editor | 返回含 nickname/avatar |
| `PUT` | `/api/workflow/{id}/collaborators/{user_id}` | 修改角色或移除 | Owner only | body: `{ role }` 或 `{ status: "removed" }` |
| `DELETE` | `/api/workflow/{id}/collaborators/{user_id}` | 移除协作者 | Owner only | — |

### 9.3 邀请响应 API

| HTTP | 路径 | 功能 | 鉴权 | 说明 |
|------|------|------|------|------|
| `GET` | `/api/workflow/invitations` | 获取我的待处理邀请 | 已登录 | 返回 `status='pending'` 的记录 |
| `POST` | `/api/workflow/invitations/{id}/accept` | 接受邀请 | 被邀请人 | `status: pending → accepted` |
| `POST` | `/api/workflow/invitations/{id}/reject` | 拒绝邀请 | 被邀请人 | `status: pending → rejected` |

### 9.4 协作空间列表 API

| HTTP | 路径 | 功能 | 鉴权 | 说明 |
|------|------|------|------|------|
| `GET` | `/api/workflow/shared` | 获取我参与协作的工作流 | 已登录 | JOIN `ss_workflow_collaborators` + `ss_workflows` |

**响应格式：**

```json
[
  {
    "id": "workflow-uuid",
    "name": "数学学习路径",
    "description": "...",
    "owner_name": "张三",
    "my_role": "editor",
    "tags": ["数学", "高等数学"],
    "updated_at": "2026-03-26T12:00:00Z"
  }
]
```

### 9.5 现有端点调整

| 端点 | 当前权限 | 改造后 |
|------|----------|--------|
| `GET /{id}/content` | `.eq("user_id", me)` | `check_workflow_access(id, me, "viewer")` |
| `PUT /{id}` | `.eq("user_id", me)` | `check_workflow_access(id, me, "editor")` |
| `DELETE /{id}` | `.eq("user_id", me)` | `check_workflow_access(id, me, "owner")` |
| `PUT /{id}` (is_public) | `.eq("user_id", me)` | `check_workflow_access(id, me, "owner")` |
| `POST /{id}/like` | 已登录 | 不变 |
| `POST /{id}/favorite` | 已登录 | 不变 |
| `GET /marketplace` | 匿名可访 | 不变 |
| `GET /{id}/public` | 匿名可访 | 不变 |

### 9.6 中间件配置更新

**`auth.py` — `UNPROTECTED_PATHS` 新增：**

```python
UNPROTECTED_PATHS = {
    # ... 现有路径 ...
    "/api/workflow/marketplace",      # 已有
}

_SOFT_AUTH_PATTERNS = [
    re.compile(r"^/api/workflow/[^/]+/public$"),  # 已有
]
```

**无需改动**：协作相关 API 全部需要严格鉴权（已在 `/api/workflow/*` 保护范围内）。

---

## 十、前端组件设计

### 10.1 新增组件清单

| 组件 | 路径 | 职责 | 行数目标 |
|------|------|------|---------|
| `ReadOnlyCanvas` | `components/workflow/ReadOnlyCanvas.tsx` | 只读画布渲染（ReactFlow readOnly 模式） | ≤180 |
| `CollaborationPopover` | `components/workflow/CollaborationPopover.tsx` | 邀请协作 Popover（搜索 + 角色选择 + 列表） | ≤250 |
| `InvitationList` | `components/layout/sidebar/InvitationList.tsx` | 待处理邀请列表 | ≤120 |
| `SharedWorkflowsPanel` | `components/layout/sidebar/SharedWorkflowsPanel.tsx` | 侧边栏"协作空间"分组 | ≤150 |
| `CanvasToolbar` | `app/c/[id]/CanvasToolbar.tsx` | 编辑页顶栏（返回 + 名称 + 操作按钮） | ≤200 |

### 10.2 `CollaborationPopover` 交互设计

```
┌──────────────────── CollaborationPopover ────────────────┐
│                                                           │
│  邀请协作者                                    [✕ 关闭]   │
│                                                           │
│  ┌─────────────────────────────────────┐                 │
│  │ 🔍 输入邮箱搜索用户...               │  [邀请]        │
│  └─────────────────────────────────────┘                 │
│  搜索结果 dropdown：                                      │
│    👤 alice@example.com  (小爱同学)                       │
│    👤 bob@university.edu.cn  (学习者Bob)                  │
│                                                           │
│  角色选择：                                                │
│  ● 可编辑 (Editor)  ○ 仅查看 (Viewer)                    │
│                                                           │
│  ── 已邀请的协作者 ─────────────────────────               │
│                                                           │
│  👤 alice    Editor   ✅ 已接受   [切换角色 ▼] [移除]     │
│  👤 bob      Viewer   ⏳ 待接受   [撤回]                  │
│                                                           │
│  ── 公开分享链接 ────────────────────────                  │
│  🔗 https://studysolo.com/s/{id}                         │
│  (当 is_public=true 时显示)         [复制链接 📋]         │
│  (当 is_public=false 时显示："工作流未公开，设为公开后可生成分享链接"） │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 10.3 前端状态管理

**新增 Store：**

```typescript
// stores/use-collaboration-store.ts

interface CollaborationStore {
  // 我参与协作的工作流
  sharedWorkflows: SharedWorkflowItem[];
  fetchSharedWorkflows: () => Promise<void>;
  
  // 待处理邀请
  pendingInvitations: Invitation[];
  fetchPendingInvitations: () => Promise<void>;
  acceptInvitation: (id: string) => Promise<void>;
  rejectInvitation: (id: string) => Promise<void>;
  
  // 当前工作流的协作者（画布页面用）
  collaborators: Collaborator[];
  fetchCollaborators: (workflowId: string) => Promise<void>;
  inviteCollaborator: (workflowId: string, email: string, role: string) => Promise<void>;
  removeCollaborator: (workflowId: string, userId: string) => Promise<void>;
}
```

### 10.4 前端 Service 层新增

```typescript
// services/collaboration.service.ts

export async function fetchSharedWorkflows(): Promise<SharedWorkflowItem[]>;
export async function fetchCollaborators(workflowId: string): Promise<Collaborator[]>;
export async function inviteCollaborator(workflowId: string, email: string, role: string): Promise<void>;
export async function removeCollaborator(workflowId: string, userId: string): Promise<void>;
export async function fetchPendingInvitations(): Promise<Invitation[]>;
export async function acceptInvitation(invitationId: string): Promise<void>;
export async function rejectInvitation(invitationId: string): Promise<void>;
```

---

## 十一、安全与边界 Case

### 11.1 安全矩阵

| 攻击向量 | 防御措施 |
|---------|---------|
| 用户猜测 `/c/{id}` UUID 访问他人工作流 | `check_workflow_access` 后端校验，非 owner/collaborator → 403 |
| 用户通过 API 直接 PUT 非自己的工作流 | 同上，所有写操作都经过权限判定 |
| 邀请不存在的邮箱做用户枚举攻击 | 统一返回 "未找到用户"，不区分 "不存在" vs "已注册但不匹配" |
| 重复邀请同一用户 | UNIQUE(workflow_id, user_id) 约束 → 409 "已邀请" |
| Collaborator 尝试删除工作流 | `required_role="owner"` → 403 |
| Collaborator 尝试切换 is_public | `required_role="owner"` → 403 |
| Collaborator 尝试邀请其他人 | `required_role="owner"` → 403 |
| Owner 邀请自己 | 前端禁止 + 后端校验 `user_id != invited_by` |

### 11.2 边界 Case 处理

| 场景 | 处理方式 |
|------|---------|
| Owner 删除工作流 | `ON DELETE CASCADE` → 自动清理 `ss_workflow_collaborators` 所有记录 |
| Owner 移除某协作者 | 该协作者下次打开 `/c/{id}` → 403，侧边栏不再显示此工作流 |
| 被邀请人注销账户 | `ON DELETE CASCADE`（user_id FK）→ 自动清理 |
| 协作者对私有工作流的访问 | viewer 角色可在 `/c/{id}` 查看未公开的工作流（区别于 `/s/{id}`） |
| 工作流配额计算 | 只统计 `user_id=me`（owner） 的工作流，协作工作流不占被邀请方配额 |
| 已拒绝的邀请能否重新邀请 | 可以：owner 删除旧记录 → 重新 INSERT（UNIQUE 约束满足） |
| 协作者 Fork 工作流 | 允许，Fork 产生的新工作流 owner 是 Fork 者 |

---

## 十二、实施优先级与任务分解

### Phase 1 — Marketplace 交互 + 路由体系 ✅ 已完成

> 不涉及协作机制，仅重构点击行为和路由

| # | 任务 | 状态 |
|---|------|------|
| P1-1 | `WorkflowExamplesPanel` 点击改为 `router.push('/s/{id}')` | ✅ |
| P1-2 | 移除 `handleFork`/`forkingId` 状态 | ✅ |
| P1-3 | `PublicWorkflowView` 增强：接入 `ReadOnlyCanvas` | ✅ |
| P1-4 | 创建 `app/c/[id]/` 路由结构 | ✅ |
| P1-5 | `/c/{id}` 页面接入已有 Canvas 编辑器逻辑 | ✅ |
| P1-6 | `middleware.ts` 确认 `/c/*` 受保护 | ✅ |
| P1-7 | 编辑页增加 "查看公开链接" 入口 | ✅ |
| P1-8 | 预览页 owner 看到 "编辑此工作流" 入口 | ✅ |
| 补充 | 未登录状态 Fork/点赞 → Toast + 登录弹窗 | ✅ |

### Phase 2 — 协作机制 MVP ✅ 已完成

| # | 任务 | 状态 |
|---|------|------|
| P2-1 | 创建 `ss_workflow_collaborators` 表 + 索引 + RLS | ✅ |
| P2-2 | 实现 `check_workflow_access()` 统一权限函数 | ✅ |
| P2-3 | 改造现有 CRUD 端点使用 `check_workflow_access` | ✅ |
| P2-4 | 协作者管理 API：邀请/列表/移除 | ✅ |
| P2-5 | 邀请响应 API：接受/拒绝 | ✅ |
| P2-6 | 协作空间列表 API | ✅ |
| P2-7 | 前端 `CollaborationPopover` 组件 | ✅ |
| P2-8 | 编辑页顶栏集成 [邀请协作] 按钮 | ✅ |
| P2-9 | `collaboration.service.ts` Service 层 | ✅ |
| P2-10 | Sidebar 新增"协作空间"分组 | ✅ |
| P2-11 | 邀请通知 UI | ✅ |

### Phase 3 — 体验增强 ✅ 已完成

| # | 任务 | 状态 |
|---|------|------|
| P3-1 | 协作者头像显示（画布右上角，Figma 风格） | ✅ |
| P3-2 | 邮件通知（Edge Function） | ⏳ 延后 |
| P3-3 | 协作者 Fork | ✅ 已有 `/s/{id}` Fork |

### Phase 4 — 远期规划（不在此文档范围）

| # | 任务 | 复杂度 | 说明 |
|---|------|--------|------|
| P4-1 | 实时协作光标（Supabase Realtime） | 极高 | 多人同时编辑，光标位置同步 |
| P4-2 | 版本历史 / 变更日志 | 高 | 每次保存生成 snapshot，可回滚 |
| P4-3 | 画布内评论/批注 | 高 | 在指定节点上添加评论 |
| P4-4 | 团队空间（超越单工作流的多人组织） | 极高 | 类似 Figma Team |

---

## 十三、验收标准

### Phase 1 E2E 验证清单

| 测试项 | 操作 | 预期结果 |
|--------|------|---------|
| Marketplace 点击 | 点击左侧样例面板卡片 | 跳转 `/s/{id}` 而非直接 Fork |
| 预览页画布 | 访问 `/s/{id}` | 看到真实的只读画布渲染 |
| 预览页 Fork | 在 `/s/{id}` 点击 Fork | 创建副本 → 跳转 `/c/{newId}` |
| 编辑页路由 | 访问 `/c/{id}` | Owner 进入编辑画布 |
| 编辑页鉴权 | 未登录访问 `/c/{id}` | 重定向到 login |
| 非 Owner 访问 | 已登录非 Owner 访问 `/c/{id}` | 403 页面 |
| 公开链接入口 | Owner 在 `/c/{id}` 且 `is_public=true` | 顶栏显示 "查看公开链接" |
| Owner 预览页 | Owner 访问 `/s/{id}` | 显示 "编辑此工作流" 按钮 |

### Phase 2 E2E 验证清单

| 测试项 | 操作 | 预期结果 |
|--------|------|---------|
| 邀请协作者 | Owner 输入邮箱邀请 Editor | `ss_workflow_collaborators` 产生 pending 记录 |
| 接受邀请 | 被邀请人点击接受 | status 变 accepted，侧边栏显示协作空间 |
| 拒绝邀请 | 被邀请人点击拒绝 | status 变 rejected，通知消失 |
| Editor 编辑 | Editor 打开 `/c/{id}` | 可编辑节点/连线/保存 |
| Editor 限制 | Editor 尝试删除工作流 | 403 |
| Viewer 只读 | Viewer 打开 `/c/{id}` | 可查看但不可编辑 |
| Owner 移除 | Owner 移除 Editor | Editor 下次访问 403 |
| 配额不影响 | 被邀请方查看工作流数量 | 协作工作流不计入 |
| 重复邀请 | Owner 邀请同一人第二次 | 409 "已邀请" |
| 自邀请 | Owner 输入自己邮箱 | 前端禁止 + 后端 400 |

### 全部 Phase 文件行数合规

| 文件 | 行数限制 |
|------|---------|
| 所有新建/修改的 `.tsx` / `.ts` / `.py` 文件 | ≤ 300 行 |

---

> **文档结束** — 本文档覆盖 Marketplace 交互重构、双 URL 路由体系、公开预览页增强、编辑画布路由创建、协作者机制五大命题。Phase 1 可独立实施（不依赖协作表），Phase 2 在 Phase 1 基础上叠加协作能力。
