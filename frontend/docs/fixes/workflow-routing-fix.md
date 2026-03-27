# 工作流路由修复文档

## 问题描述

### 错误现象
新建工作流后，由于路径错误会报错：
```
[fetchWorkflowContent] HTTP 500 "for" "new"
at fetchWorkflowContent (src\services\workflow.service.ts:89:15)
at PrivateCanvasPage (src\app\(dashboard)\c\[id]\page.tsx:31:20)
```

### 根本原因
1. `workspace/page.tsx` 中使用了静态链接 `<a href="/workspace/new">`
2. 动态路由 `/workspace/[id]` 将 `"new"` 当作工作流ID
3. 重定向到 `/c/new` 后，画布页面尝试加载 ID 为 `"new"` 的工作流
4. 后端收到 `GET /api/workflow/new/content` 请求，返回 500 错误

## 修复方案

### 方案1：修复静态链接（已采用）

#### 优点
- 代码改动最小
- 与现有的 Navbar/MobileNav 保持一致
- 避免不必要的路由跳转
- 用户体验更好（即时反馈，显示加载状态）

#### 实施步骤

1. **拆分服务端和客户端组件**
   - `workspace/page.tsx` → 服务端组件（数据获取）
   - `WorkspacePageClient.tsx` → 客户端组件（交互逻辑）

2. **使用 `useCreateWorkflowAction` hook**
   ```tsx
   const { creating, createWorkflow } = useCreateWorkflowAction();
   
   <button
     onClick={() => void createWorkflow()}
     disabled={isFull || creating}
   >
     {creating ? '创建中...' : '新建工作流'}
   </button>
   ```

3. **添加防御性路由保护**
   在 `/c/[id]/page.tsx` 和 `/workspace/[id]/page.tsx` 中：
   ```tsx
   const RESERVED_SEGMENTS = ['new', 'create', 'edit', 'settings'];
   
   if (RESERVED_SEGMENTS.includes(id.toLowerCase())) {
     redirect('/workspace');
   }
   ```

## 修改的文件

### 1. `frontend/src/app/(dashboard)/workspace/page.tsx`
- 改为纯服务端组件
- 只负责数据获取
- 将UI渲染委托给 `WorkspacePageClient`

### 2. `frontend/src/app/(dashboard)/workspace/WorkspacePageClient.tsx` (新建)
- 客户端组件
- 使用 `useCreateWorkflowAction` hook
- 将 `<a href="/workspace/new">` 改为 `<button onClick={createWorkflow}>`
- 添加加载状态和禁用逻辑

### 3. `frontend/src/app/(dashboard)/c/[id]/page.tsx`
- 添加 `RESERVED_SEGMENTS` 常量
- 在加载工作流前检查ID是否为保留字
- 如果是保留字，重定向到 `/workspace`

### 4. `frontend/src/app/(dashboard)/workspace/[id]/page.tsx`
- 添加相同的保留字检查
- 防止旧路由也出现相同问题

## 工作流创建流程

### 修复前（错误）
```
用户点击 <a href="/workspace/new">
  → 浏览器导航到 /workspace/new
  → 动态路由 [id] 捕获 "new"
  → 重定向到 /c/new
  → 尝试加载 ID="new" 的工作流
  → 后端 500 错误 ❌
```

### 修复后（正确）
```
用户点击 <button onClick={createWorkflow}>
  → useCreateWorkflowAction hook
  → POST /api/workflow (创建新工作流)
  → 后端返回 { id: "uuid" }
  → router.push(`/c/${uuid}`)
  → 加载真实的工作流 ✅
```

## 防御性保护

### 保留字列表
```typescript
const RESERVED_SEGMENTS = ['new', 'create', 'edit', 'settings'];
```

### 保护逻辑
```typescript
if (RESERVED_SEGMENTS.includes(id.toLowerCase())) {
  redirect('/workspace');
}
```

这确保即使未来有人不小心创建了指向这些路径的链接，也不会导致系统崩溃。

## 架构最佳实践

### 1. 避免保留字作为动态参数
- ❌ `/workflow/new` → 被 `/workflow/[id]` 捕获
- ✅ `/workflow/create` → 独立路由
- ✅ 使用编程式导航 + API 调用

### 2. 统一创建流程
- Navbar: `useCreateWorkflowAction` ✅
- MobileNav: `useCreateWorkflowAction` ✅
- WorkspacePage: `useCreateWorkflowAction` ✅（修复后）

### 3. 服务端/客户端组件分离
- 服务端：数据获取、认证检查
- 客户端：交互逻辑、状态管理

## 测试验证

### 手动测试
1. 访问 `/workspace` 页面
2. 点击"新建工作流"按钮
3. 验证：
   - 按钮显示"创建中..."
   - 成功创建后跳转到 `/c/{uuid}`
   - 画布正常加载

### 边界情况测试
1. 直接访问 `/workspace/new` → 重定向到 `/workspace`
2. 直接访问 `/c/new` → 重定向到 `/workspace`
3. 直接访问 `/c/create` → 重定向到 `/workspace`
4. 容量已满时点击按钮 → 按钮禁用，无法点击

## 相关文件

### 核心文件
- `frontend/src/features/workflow/hooks/use-create-workflow-action.ts`
- `frontend/src/services/workflow.service.ts`
- `backend/app/api/workflow.py`

### 路由文件
- `frontend/src/app/(dashboard)/workspace/page.tsx`
- `frontend/src/app/(dashboard)/workspace/WorkspacePageClient.tsx`
- `frontend/src/app/(dashboard)/c/[id]/page.tsx`
- `frontend/src/app/(dashboard)/workspace/[id]/page.tsx`

### 配置文件
- `frontend/next.config.ts` (API rewrites)

## 总结

这次修复解决了一个典型的**路由设计问题**：
- 静态链接与动态路由冲突
- 保留字被当作动态参数
- 缺少参数验证

通过采用**编程式导航**和**防御性保护**，确保了系统的健壮性和用户体验。

---

**修复日期**: 2026-03-27  
**修复方案**: 方案1 - 修复静态链接  
**影响范围**: 工作流创建流程  
**向后兼容**: 是
