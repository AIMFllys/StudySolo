# StudySolo Frontend

## 1. 技术栈
- Framework: Next.js 16 (App Router) + React 19
- State: Zustand
- UI: Tailwind CSS v4 + shadcn/ui
- Runtime Features: SSE、Supabase SSR session、动态工作流画布
- Test: Vitest + fast-check（属性测试）

## 2. 快速启动
```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

默认本地地址：`http://localhost:2037`

## 3. 环境变量
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 后端 API 根地址（Next.js rewrites /api/*）
NEXT_PUBLIC_API_BASE_URL=http://localhost:2038

# 兼容旧变量（逐步废弃）
# NEXT_PUBLIC_APP_URL=http://localhost:2038
```

## 4. 当前前端架构（重构后）

### 4.1 路由层（薄页面）
`src/app/**/page.tsx` 仅负责路由入口与页面装配，复杂逻辑已迁移至 `features/*`。

### 4.2 Feature 分层
```text
src/
  app/                         # 路由入口层（薄）
  features/
    auth/                      # 登录/注册/找回密码页面模块化
    admin/
      shared/                  # PageHeader/KpiCard/Pagination/Badge/Formatters
      dashboard/
      users/
      notices/
      workflows/
      ratings/
      members/
      config/
      audit/
    settings/                  # Settings 页面逻辑
  services/                    # API 请求入口
  hooks/                       # 通用 hooks
  stores/                      # Zustand stores
  types/                       # 领域类型（auth/admin/settings/async）
  styles/                      # 全局样式拆分（tokens/base/glass/workflow）
```

### 4.3 API 访问规范
- 页面/布局组件不直接实现业务请求流程。
- 统一通过 `services/*` 与 feature hooks 触发请求。
- `DashboardShell/Navbar/MobileNav` 的“新建工作流”行为统一为 `useCreateWorkflowAction`。

## 5. 行数治理（强约束）

### 5.1 总规则
- `src/**/*.ts|tsx|css` 每个文件必须 `<= 300` 行。
- `src/app/**/page.tsx` 默认必须 `<= 220` 行。
- 当前仓库已达到 `0` 超限文件。

### 5.2 检查命令
```bash
pnpm lint:lines            # strict（300）+ page（220）
pnpm lint:lines:strict
pnpm lint:lines:ratchet
pnpm lint:lines:baseline   # 生成/刷新 baseline
pnpm lint:pages
```

### 5.3 strict vs ratchet
- `strict`: 任意超限直接失败。
- `ratchet`: 禁止新增超限或让历史超限变更更大（适合分阶段治理）。

baseline 文件：`scripts/max-lines-baseline.json`

page 例外配置：`scripts/page-lines-exceptions.json`
- 仅允许极少数页面临时放宽（例如 220~260），必须在代码评审说明理由。

## 6. 本轮已落地的重构重点
- Auth 页面：`login/register/forgot-password` 拆到 `features/auth`，复用统一壳层与验证码倒计时 hook。
- Admin 大页面：`dashboard/users/users-detail/notices/workflows` 拆分到 `features/admin/*`。
- Admin 其余页面：`ratings/members/config/audit` 页面入口改为薄壳。
- Settings 页面入口改为薄壳，逻辑放入 `features/settings`。
- 全局样式：`globals.css` 拆分为 `styles/tokens.css`、`styles/base.css`、`styles/glass.css`、`styles/workflow.css`。
- 测试拆分：
  - `integration-fixes.property.test.ts` → 4 个独立属性测试文件
  - `admin-markdown-preview.property.test.ts` → 2 个文件
- 规范化类型：新增 `src/types/auth.ts`、`src/types/admin/*`、`src/types/settings.ts`、`src/types/async.ts`。
- 新增复用 hooks：
  - `useVerificationCountdown`
  - `useAdminListQuery`
  - `useToastQueue`
  - `useWorkflowContextMenu`

## 7. 质量门禁
每次提交建议执行：
```bash
pnpm lint
pnpm lint:lines
pnpm test
```

## 8. 开发约定
- 页面文件保持薄（建议 <= 220 行）。
- 复杂逻辑优先沉到 `features/*/hooks` 与 `services/*`。
- `stores/*` 仅维护状态与同步更新，不放网络请求、路由跳转、副作用定时器。
- 业务副作用统一放到 `hooks/*` 或 `services/*`（例如 admin logout action）。
- 领域类型必须放在 `src/types/*`，禁止页面内长期内联大段 `interface/type`。
- 新增样式优先放在 `src/styles/*` 或组件局部样式，不扩张 `app/globals.css`。
