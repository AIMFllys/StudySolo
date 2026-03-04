# StudySolo 前端工程规范（升级版）

> 最后更新：2026-03-04
> 适用范围：`StudySolo/frontend/src/**`

## 1. 目标
本规范用于保证前端代码在持续迭代下仍可维护、可测试、可分阶段重构。
核心目标：
- 文件规模可控
- 页面职责单一
- 业务请求入口统一
- 类型与样式规范化

## 2. 强制规则

### 2.1 文件行数硬约束
- `src/**/*.ts|tsx|css` 必须 `<= 300` 行。
- 超限文件禁止合并。
- 禁止通过无意义空行/注释规避约束。

### 2.2 页面职责约束
- `app/**/page.tsx` 仅负责：
  - 路由参数读取
  - feature 组件装配
  - 页面级布局组织
- 复杂逻辑（请求、副作用、状态机、长表单）必须下沉到 `features/*`。
- 页面默认上限：`<= 220` 行（可通过例外清单临时放宽，需评审说明）。

### 2.3 数据访问约束
- 页面层与 layout 层禁止散落业务 `fetch`。
- 统一通过 `services/*` 或 feature hooks 访问后端。
- 错误处理需统一为可展示、可重试的状态。

### 2.4 类型约束
- 领域类型必须定义在 `src/types/*`。
- 禁止在页面文件长期维护大段内联接口。
- 共享类型命名必须具备业务语义（如 `PaginatedUserList`）。

### 2.6 状态管理约束
- `stores/*` 仅负责状态与同步状态更新函数。
- 禁止在 store 内直接执行网络请求、路由跳转、定时器等副作用。
- 副作用逻辑必须放在 `hooks/*` 或 `services/*`，并由页面/组件编排调用。

### 2.5 样式约束
- `app/globals.css` 只作为聚合入口，不承载大段样式实现。
- 全局样式拆分到 `src/styles/*`：`tokens/base/glass/workflow` 等。
- 新增全局类需评估复用性，优先复用既有 token/class。

## 3. 推荐目录结构
```text
src/
  app/                         # 路由入口层
  features/                    # 业务域模块
  services/                    # API 请求层
  hooks/                       # 通用 hooks
  stores/                      # Zustand 状态
  types/                       # 领域类型
  styles/                      # 全局样式分层
```

## 4. 行数门禁策略

### 4.1 strict 模式
- 命令：`pnpm lint:lines:strict`
- 规则：任意超限文件直接失败。

### 4.2 ratchet 模式
- 命令：`pnpm lint:lines:ratchet`
- 规则：
  - 禁止新增超限文件
  - 禁止历史超限文件行数回升
- 适用：分阶段重构、多 PR 消债。

### 4.3 baseline 管理
- baseline 文件：`frontend/scripts/max-lines-baseline.json`
- 生成命令：`pnpm lint:lines:baseline`

### 4.4 page 行数门禁
- 命令：`pnpm lint:pages`
- 默认规则：`src/app/**/page.tsx <= 220`。
- 例外清单：`frontend/scripts/page-lines-exceptions.json`。
- 例外仅用于短期过渡，禁止长期保留无理由放宽。

## 5. PR 要求
每个 PR 最低要求：
1. `pnpm lint`
2. `pnpm lint:lines`（包含 `lint:pages`）
3. 与改动域相关的测试通过

最终收口 PR 要求：
1. `pnpm lint`
2. `pnpm lint:lines:strict`
3. `pnpm test`

## 6. 重构执行约定
- 优先拆超限文件，再做体验优化。
- 先抽共享组件/类型，再迁移页面。
- 每次迁移要保持后端 API 契约不变。
- 重要用户路径必须回归：Auth、Dashboard Workflow、Admin 核心操作。
