# StudySolo 命名规范

> 最后更新：2026-02-28
> 这份文件解决 AI 每次"自由发挥"变量名的问题，是返工率最高的痛点之一。

## 变量命名模式

### 前端（TypeScript / React）

| 场景 | 规则 | 正例 | 反例（禁止） |
|------|------|------|-------------|
| 布尔值 | `is` / `has` / `should` 前缀 | `isLoading`, `hasNodes`, `shouldAutoSave` | `loading`, `nodeExist`, `autoSave` |
| 事件处理 | `handle` 前缀 | `handleNewWorkflow`, `handleNodeClick` | `onClickNew`, `newWorkflowClick` |
| 回调 Props | `on` 前缀 | `onNewWorkflow`, `onClose`, `onChange` | `handleNewWorkflow`（props 层不用 handle） |
| 异步函数 | 动词开头，不加 `async` 后缀 | `fetchWorkflows`, `createWorkflow` | `asyncGetWorkflows`, `workflowFetch` |
| 状态变量 | 名词 / 名词短语 | `workflows`, `selectedNodeId` | `getWorkflows`, `nodeSelected` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` | `maxRetries`, `apiBaseUrl` |
| 类型/接口 | PascalCase，不加 `I` 前缀 | `AIStepNodeData`, `WorkflowNode` | `IAIStepNodeData`, `workflow_node` |
| 枚举值 | snake_case 字符串字面量 | `'trigger_input'`, `'ai_analyzer'` | `'TriggerInput'`, `'TRIGGER_INPUT'` |
| Zustand Store | `use-xxx-store.ts` 文件，`useXxxStore` 导出 | `useWorkflowStore` | `workflowStore`, `WorkflowStore` |
| React Hook | `use` 前缀 | `useWorkflowSync`, `useWorkflowExecution` | `workflowSync`, `syncHook` |

### 后端（Python / FastAPI）

| 场景 | 规则 | 正例 | 反例（禁止） |
|------|------|------|-------------|
| 变量/函数 | snake_case | `execute_workflow`, `get_current_user` | `executeWorkflow`, `getCurrentUser` |
| 类名 | PascalCase | `WorkflowCreate`, `UserInfo` | `workflow_create`, `user_info` |
| 常量 | UPPER_SNAKE_CASE | `_META_COLS`, `_COOKIE_OPTS` | `metaCols`, `cookieOpts` |
| 私有变量 | 单下划线前缀 | `_IS_DEV`, `_save_results` | `IS_DEV`（模块级私有必须加下划线） |
| Pydantic 字段 | snake_case | `user_input`, `nodes_json` | `userInput`, `nodesJson` |
| API 路由函数 | snake_case 动词 | `list_workflows`, `create_workflow` | `getWorkflows`, `workflowCreate` |
| 枚举 | PascalCase 类名 + snake_case 值 | `NodeType.ai_analyzer` | `NodeType.AI_ANALYZER` |

## 文件和目录命名规则

| 层级 | 规则 | 正例 | 反例（禁止） |
|------|------|------|-------------|
| 前端页面目录 | kebab-case + 括号分组 | `(auth)/`, `(dashboard)/` | `Auth/`, `authPages/` |
| 前端组件文件 | PascalCase.tsx | `Sidebar.tsx`, `WorkflowCanvas.tsx` | `sidebar.tsx`, `workflow-canvas.tsx` |
| 前端 Hook 文件 | kebab-case.ts | `use-workflow-sync.ts` | `useWorkflowSync.ts`, `workflow_sync.ts` |
| 前端 Store 文件 | kebab-case.ts | `use-workflow-store.ts` | `workflowStore.ts` |
| 前端工具文件 | kebab-case.ts | `auth.service.ts` | `AuthService.ts` |
| 前端类型文件 | kebab-case.ts | `index.ts`（统一导出） | `Types.ts` |
| 后端模块文件 | snake_case.py | `workflow_engine.py`, `ai_router.py` | `workflowEngine.py`, `AiRouter.py` |
| 后端 API 路由 | snake_case.py | `auth.py`, `workflow.py` | `Auth.py`, `workflowRoutes.py` |
| 配置文件 | kebab-case / 约定名 | `config.yaml`, `gunicorn.conf.py` | `Config.yaml` |
| 文档文件 | kebab-case.md | `architecture.md`, `naming.md` | `Architecture.md`, `NAMING.md` |

## 工程规模约束（新增 · 2026-03-04）

- 前端 `frontend/src/**` 下所有 `.ts/.tsx/.css` 文件必须 **≤ 300 行**。
- 超过 300 行禁止直接合并，必须按模块拆分后提交。
- 页面文件建议控制在 `150~220` 行，超过 `220` 需拆分。
- 详细规范与拆分流程见：[frontend-engineering-spec.md](frontend-engineering-spec.md)

## API 字段与前端字段映射

后端 Supabase/Pydantic 使用 snake_case，前端 TypeScript 使用 camelCase。映射规则：

| 后端字段 (snake_case) | 前端字段 (camelCase) | 说明 |
|----------------------|---------------------|------|
| `user_id` | `userId` | 用户 ID |
| `workflow_id` | `workflowId` | 工作流 ID |
| `nodes_json` | `nodesJson` | 节点 JSON 数据 |
| `edges_json` | `edgesJson` | 连线 JSON 数据 |
| `created_at` | `createdAt` | 创建时间 |
| `updated_at` | `updatedAt` | 更新时间 |
| `user_input` | `userInput` | 用户输入 |
| `system_prompt` | `systemPrompt` | 系统提示词 |
| `model_route` | `modelRoute` | 模型路由 |
| `access_token` | `accessToken` | 访问令牌 |
| `refresh_token` | `refreshToken` | 刷新令牌 |
| `avatar_url` | `avatarUrl` | 头像 URL |

### 映射规则

- 前端接收后端数据后，**不做字段名转换**（当前项目中 Supabase 返回的 snake_case 直接在前端使用）
- TypeScript 类型定义中保持 snake_case 以匹配数据库字段（如 `nodes_json`）
- 仅在前端自定义变量中使用 camelCase（如组件 props、本地状态）

## 禁止写法清单

以下写法在代码审查中一律打回：

1. ❌ 匈牙利命名法：`strName`, `intCount`, `arrItems`
2. ❌ 缩写不一致：同一概念混用 `wf` / `workflow` / `flow`
3. ❌ 无意义命名：`data`, `info`, `temp`, `result`（除非作用域极小）
4. ❌ 拼音命名：`gongzuoliu`, `yonghu`
5. ❌ 前端文件用 snake_case：`workflow_canvas.tsx`
6. ❌ 后端文件用 camelCase：`workflowEngine.py`
7. ❌ 布尔值不加前缀：`visible`, `open`（应为 `isVisible`, `isOpen`）
8. ❌ 事件处理不加 handle：`clickButton`, `submitForm`
9. ❌ 类型加 I 前缀：`IWorkflowNode`, `IUserInfo`
10. ❌ 混用单复数：`node` 表示数组（应为 `nodes`）

## 项目专有术语统一

| 概念 | 统一用词 | 禁止用词 |
|------|---------|---------|
| 工作流 | `workflow` | `flow`, `wf`, `process` |
| 节点 | `node` | `step`, `block`, `item` |
| 连线 | `edge` | `link`, `connection`, `line` |
| 画布 | `canvas` | `board`, `diagram`, `graph` |
| 执行 | `execute` / `run` | `start`（仅用于 Hook 方法名） |
| 用户输入 | `userInput` | `prompt`, `query`, `message` |
| AI 输出 | `output` | `result`, `response`, `content` |

## 数据库表命名规范（共享 Supabase）

> **📌 重要**：本项目与 1037Solo Platform 共享同一个 Supabase Project（`hofcaclztjazoytmckup`）。  
> 详见 [共享 Supabase 数据库规范](Plans/daily_plan/user_auth/07-shared-supabase-database-convention.md)

### 表名前缀规则

| 前缀 | 归属 | 示例 |
|:---|:---|:---|
| **无前缀** | 两个项目共享的表 | `user_profiles`, `subscriptions`, `verification_codes_v2` |
| **`ss_`** | StudySolo 专属表 | `ss_workflows`, `ss_workflow_runs`, `ss_usage_daily` |
| **`pt_`** | 1037Solo Platform 专属表 | `pt_conversations`, `pt_messages`, `pt_ai_models` |

### 数据库字段命名

| 场景 | 规则 | 正例 | 反例（禁止） |
|------|------|------|-------------|
| 表名 | snake_case + 前缀 | `ss_workflows`, `user_profiles` | `SsWorkflows`, `userProfiles` |
| 列名 | snake_case | `user_id`, `created_at` | `userId`, `CreatedAt` |
| 主键 | `id` (UUID 类型) | `id UUID PK REFERENCES auth.users(id)` | `user_id` 作为主键名 |
| 外键 | `{关联表}_id` | `user_id`, `workflow_id` | `uid`, `wf_id` |
| 布尔值 | `is_` / `has_` 前缀 | `is_student_verified`, `is_active` | `student_verified`, `active` |
| 时间戳 | `{动作}_at` | `created_at`, `updated_at`, `expires_at` | `create_time`, `updateDate` |

### 禁止事项

1. ❌ 不要创建没有前缀的 StudySolo 专属表（必须用 `ss_` 前缀）
2. ❌ 不要创建与 Platform 同名的表（避免冲突）
3. ❌ 不要在代码中硬编码 Supabase Project ID
4. ❌ 不要跳过 RLS 策略（所有表必须启用）

