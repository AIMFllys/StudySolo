# StudySolo Frontend

> Next.js 16 + React 19 主应用前端，运行于 `port 2037`

## 1. 技术栈

| 维度 | 选型 |
| :--- | :--- |
| **框架** | Next.js 16 (App Router) + React 19 |
| **状态管理** | Zustand（内置 Undo/Redo 快照） |
| **样式** | Tailwind CSS v4 + shadcn/ui |
| **画布引擎** | @xyflow/react (React Flow) |
| **运行时特性** | SSE 流式通信、Supabase SSR session、动态工作流画布 |
| **测试** | Vitest + fast-check（属性测试） |

## 2. 快速启动

```bash
pnpm install
cp .env.example .env.local    # 填入 Supabase 真实凭据
pnpm dev
# http://localhost:2037
```

## 3. 环境变量

复制 `.env.example` 为 `.env.local`，并填入真实值：

| 变量 | 说明 | 示例 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目地址 | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 | `eyJhbGci...` |
| `NEXT_PUBLIC_API_BASE_URL` | 后端 API 基础 URL | 本地: `http://localhost:2038`，生产: `https://studyflow.1037solo.com` |
| `INTERNAL_API_BASE_URL` | 服务端 rewrites 优先使用 | `http://127.0.0.1:2038` |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | SSO Cookie 域（仅生产） | `.1037solo.com` |

> ⚠️ **生产部署注意**：所有 `NEXT_PUBLIC_` 变量在 `pnpm run build` 时被编译进 JS。修改后**必须重新 build**，仅重启进程无效。

## 4. 项目架构

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
      dashboard/               # 后台仪表盘
      users/                   # 用户管理
      notices/                 # 公告管理
      workflows/               # 工作流管理
      ratings/                 # 评分管理
      members/                 # 成员管理
      config/                  # 系统配置
      audit/                   # 审计日志
    settings/                  # Settings 页面逻辑
    workflow/                  # 工作流核心（画布/节点/执行面板）
  services/                    # API 请求入口
  hooks/                       # 通用 hooks
  stores/                      # Zustand stores
  types/                       # 领域类型（auth/admin/settings/async）
  styles/                      # 全局样式拆分（tokens/base/glass/workflow）
```

### 4.3 API 访问规范

- 页面/布局组件不直接实现业务请求流程
- 统一通过 `services/*` 与 feature hooks 触发请求
- `next.config.ts` 中的 `rewrites()` 将 `/api/*` 代理到后端

## 5. 行数治理（强约束）

| 规则 | 限制 |
| :--- | :--- |
| `src/**/*.ts\|tsx\|css` | ≤ 300 行/文件 |
| `src/app/**/page.tsx` | ≤ 220 行/文件 |

```bash
pnpm lint:lines            # strict（300）+ page（220）
pnpm lint:lines:strict     # 严格模式
pnpm lint:lines:ratchet    # 渐进治理模式（禁止新增超限）
pnpm lint:lines:baseline   # 生成/刷新 baseline
```

baseline 文件：`scripts/max-lines-baseline.json`
page 例外配置：`scripts/page-lines-exceptions.json`

## 6. 质量门禁

每次提交建议执行：

```bash
pnpm lint           # ESLint 静态检查
pnpm lint:lines     # 行数限制检查
pnpm test           # Vitest 单元测试
```

## 7. 生产部署

```bash
pnpm run build              # 编译（NEXT_PUBLIC_ 变量在此刻烘焙进 JS）
pm2 restart studysolo-frontend  # 重启 PM2 进程
```

详细部署流程请参考 [服务器与宝塔部署完整指南](../docs/技术指导/服务器与宝塔部署完整指南.md)。

## 8. 开发约定

- 页面文件保持薄（建议 ≤ 220 行）
- 复杂逻辑优先沉到 `features/*/hooks` 与 `services/*`
- `stores/*` 仅维护状态与同步更新，不放网络请求、路由跳转、副作用定时器
- 业务副作用统一放到 `hooks/*` 或 `services/*`
- 领域类型必须放在 `src/types/*`，禁止页面内长期内联大段 `interface/type`
- 新增样式优先放在 `src/styles/*` 或组件局部样式，不扩张 `app/globals.css`
