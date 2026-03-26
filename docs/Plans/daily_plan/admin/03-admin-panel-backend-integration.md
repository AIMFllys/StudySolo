# 后台管理面板 · 前后端全对接规划文档

> 📅 创建日期：2026-03-26
> 📌 所属模块：Admin · 后台管理面板
> 🔗 关联文档：[01-admin-panel-design.md](./01-admin-panel-design.md) · [项目架构全景](../../项目规范与框架流程/项目规范/项目架构全景.md)
> 🎯 核心目标：将所有纯 MOCK 前端模块对接后端真实 API，统一设计语言

---

## 一、现状审计

### 1.1 前后端对接状态矩阵

| 模块 | 前端组件 | 后端 API | 前端是否对接 API | 当前状态 |
|------|---------|---------|:---:|------|
| **认证** | `admin.service.ts` | `admin_auth.py` (9.3KB) | ✅ | 已对接 |
| **仪表盘** | `AdminDashboardPageView.tsx` | `admin_dashboard.py` (7.4KB) | ❌ **MOCK** | 纯前端硬编码数据 |
| **用户列表** | `AdminUsersPageView.tsx` | `admin_users.py` (11.5KB) | ❌ **MOCK** | 纯前端硬编码数据 |
| **用户详情** | `AdminUserDetailPageView.tsx` | `admin_users.py` | ✅ | 已对接 (`adminFetch`) |
| **公告管理** | `AdminNoticesPageView.tsx` | `admin_notices.py` (12.7KB) | ✅ | 已对接 (`adminFetch`) |
| **工作流监控** | `AdminWorkflowsPageView.tsx` | `admin_workflows.py` (7.9KB) | ✅ | 已对接 (`adminFetch`) |
| **成员管理** | `AdminMembersPageView.tsx` | `admin_members.py` (5.8KB) | ✅ | 已对接 (`adminFetch`) |
| **评分数据** | `AdminRatingsPageView.tsx` | `admin_ratings.py` (4.7KB) | ✅ | 已对接 (`adminFetch`) |
| **系统配置** | `AdminConfigPageView.tsx` | `admin_config.py` (3.8KB) | ❌ **MOCK** | 纯前端硬编码数据 |
| **审计日志** | `AdminAuditPageView.tsx` | `admin_audit.py` (3.2KB) | ❌ **MOCK** | 纯前端硬编码数据 |
| **计费管理** | `AdminBillingPageView.tsx` | ❌ 无后端 | ❌ **MOCK** | 纯前端，后端也不存在 |
| **AI 模型** | 路由存在 `models/` | `admin_models.py` (5.6KB) | ❌ 待确认 | 需审查 |

### 1.2 问题总结

1. **4 个核心模块纯 MOCK**：Dashboard、Users 列表、Config、Audit — 已有后端 API 但前端未调用
2. **设计语言不统一**：已对接模块 (ratings/members) 使用旧暗色玻璃态风格，与 Ink & Parchment 设计系统不一致
3. **前端独有组件重复造轮子**：Members 模块自行定义了 `KpiCard`、`maskEmail`、`formatDate` 等，未使用 `shared/` 统一组件
4. **Billing 模块缺后端**：前端页面存在但无对应后端 API
5. **文件行数合规**：当前绝大多数文件在 300 行以内 ✅

---

## 二、目标架构设计

### 2.1 目标文件树

```
frontend/src/
├── features/admin/
│   ├── shared/                          # ⭐ 统一共享层 (已存在，需扩展)
│   │   ├── index.ts                     # Barrel export
│   │   ├── utils.ts                     # 格式化工具 (<100 行)
│   │   ├── badges.ts                    # 徽章常量 (<100 行)
│   │   ├── components.tsx               # 通用 UI 组件 (<300 行)
│   │   ├── AdminSidebar.tsx             # 侧边栏 (<200 行)
│   │   └── AdminTopbar.tsx              # 顶栏 (<150 行)
│   │
│   ├── hooks/
│   │   ├── use-admin-sidebar-navigation.ts  # 侧边栏导航 (已存在)
│   │   ├── use-admin-list-query.ts          # 通用列表查询 Hook (已存在)
│   │   └── use-admin-logout-action.ts       # 登出 (已存在)
│   │
│   ├── dashboard/                       # [待重构] MOCK → 真实 API
│   │   ├── index.ts                     # Barrel export
│   │   ├── AdminDashboardPageView.tsx   # 主页面 (<300 行)
│   │   ├── DashboardKpiSection.tsx      # KPI 卡片区 (新增, <150 行)
│   │   ├── DashboardCharts.tsx          # 图表区 (新增, <200 行)
│   │   └── DashboardActivityTable.tsx   # 活动记录表 (新增, <150 行)
│   │
│   ├── users/                           # [待重构] 列表页 MOCK → 真实 API
│   │   ├── index.ts
│   │   ├── AdminUsersPageView.tsx       # 用户列表 → 对接 API (<250 行)
│   │   ├── AdminUserDetailPageView.tsx  # 用户详情 (已对接 ✅)
│   │   ├── UserDetailLoading.tsx        # 骨架屏 (已存在)
│   │   ├── UserDetailPanels.tsx         # 详情面板 (已存在)
│   │   └── user-shared.tsx              # 用户共享组件 (已存在)
│   │
│   ├── notices/                         # ✅ 已对接
│   │   ├── index.ts
│   │   ├── AdminNoticesPageView.tsx     # (<170 行)
│   │   ├── AdminNoticesTable.tsx        # (<200 行)
│   │   └── NoticeEditor.tsx             # 编辑器
│   │
│   ├── workflows/                       # ✅ 已对接
│   │   ├── index.ts
│   │   └── AdminWorkflowsPageView.tsx   # (<220 行)
│   │
│   ├── members/                         # [待重构] 已对接但需统一设计语言
│   │   └── AdminMembersPageView.tsx     # → 使用 shared/ 组件 (<250 行)
│   │
│   ├── ratings/                         # [待重构] 已对接但需统一设计语言
│   │   ├── AdminRatingsPageView.tsx     # → 使用 shared/ 组件 (<130 行)
│   │   └── AdminRatingsTable.tsx
│   │
│   ├── config/                          # [待重构] MOCK → 真实 API
│   │   └── AdminConfigPageView.tsx      # → 对接 /api/admin/config (<280 行)
│   │
│   ├── audit/                           # [待重构] MOCK → 真实 API
│   │   ├── AdminAuditPageView.tsx       # 主页面 → 对接 API (<200 行)
│   │   └── AuditDetailPane.tsx          # 详情面板 (新增拆分, <150 行)
│   │
│   └── billing/                         # [待新建] 需后端 API 支持
│       ├── AdminBillingPageView.tsx      # → 等后端 API (<250 行)
│       └── index.ts
│
├── services/
│   └── admin.service.ts                 # ⭐ 需扩展 — 增加各模块 API 函数
│
├── stores/
│   └── use-admin-store.ts               # ✅ 已存在
│
└── types/admin/
    ├── index.ts                         # Barrel
    ├── dashboard.ts                     # [待新增] Dashboard 类型
    ├── users.ts                         # ✅ 已存在
    ├── notices.ts                       # ✅ 已存在
    ├── workflows.ts                     # ✅ 已存在
    ├── members.ts                       # ✅ 已存在
    ├── ratings.ts                       # ✅ 已存在
    ├── config.ts                        # [待扩展] 真实 API 响应类型
    └── audit.ts                         # [待扩展] 真实 API 响应类型
```

### 2.2 后端文件树 (已完善，仅列示)

```
backend/app/
├── api/
│   ├── admin_auth.py          # ✅ 9.3KB
│   ├── admin_dashboard.py     # ✅ 7.4KB (前端未调用)
│   ├── admin_users.py         # ✅ 11.5KB (列表 API 前端未调用)
│   ├── admin_notices.py       # ✅ 12.7KB
│   ├── admin_workflows.py     # ✅ 7.9KB
│   ├── admin_models.py        # ✅ 5.6KB
│   ├── admin_members.py       # ✅ 5.8KB
│   ├── admin_ratings.py       # ✅ 4.7KB
│   ├── admin_config.py        # ✅ 3.8KB (前端未调用)
│   └── admin_audit.py         # ✅ 3.2KB (前端未调用)
├── middleware/
│   └── admin_auth.py          # ✅ Pure ASGI 中间件
└── models/
    └── admin.py               # ✅ Pydantic 模型
```

---

## 三、实施计划

### Phase 1 — Dashboard 对接 (优先级: P0)

> **目标**: 将 `AdminDashboardPageView` 从全 MOCK 改为调用后端 `/api/admin/dashboard/*`

#### Task 1.1: 定义 Dashboard TypeScript 类型

**文件**: `frontend/src/types/admin/dashboard.ts`

```typescript
export interface DashboardOverviewResponse {
  total_users: number;
  dau: number;
  wau: number;
  mau: number;
  total_workflows: number;
  today_runs: number;
  today_success_rate: number;
  mrr: number;
  arpu: number;
  nps_score: number | null;
  edu_users: number;
  paid_users: number;
  conversion_rate: number;
  models_health: Record<string, {
    status: 'healthy' | 'degraded' | 'down';
    avg_latency_ms: number;
  }>;
}

export interface DashboardChartsResponse {
  user_growth: { date: string; new_users: number; cumulative: number }[];
  workflow_distribution: { name: string; count: number; pct: number }[];
  recent_activities: {
    id: string;
    action: string;
    operator: string;
    timestamp: string;
    status: 'success' | 'running' | 'failed';
    detail: string;
  }[];
}
```

#### Task 1.2: 拆分 Dashboard 组件 + 对接 API

将当前 300 行的 `AdminDashboardPageView` 拆分为：

| 新文件 | 行数 | 职责 |
|--------|------|------|
| `AdminDashboardPageView.tsx` | ~150 | 主容器、数据获取、布局编排 |
| `DashboardKpiSection.tsx` | ~100 | 4 个 KPI 卡片 |
| `DashboardCharts.tsx` | ~150 | 用户增长折线图 + 工作流分布柱状图 |
| `DashboardActivityTable.tsx` | ~120 | 近期活动记录表格 |

**核心改动**: 删除 `MOCK_KPI`/`MOCK_DISTRIBUTION`/`MOCK_ACTIVITY` → 使用 `adminFetch`:

```typescript
// AdminDashboardPageView.tsx (核心逻辑)
const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
const [charts, setCharts] = useState<DashboardChartsResponse | null>(null);

useEffect(() => {
  const load = async () => {
    const [ov, ch] = await Promise.all([
      adminFetch<DashboardOverviewResponse>('/dashboard/overview'),
      adminFetch<DashboardChartsResponse>('/dashboard/charts?range=7d'),
    ]);
    setOverview(ov);
    setCharts(ch);
  };
  void load();
}, []);
```

#### Task 1.3: 验收标准

- [ ] KPI 卡片展示后端真实数据
- [ ] 图表从 SVG 硬编码改为 Recharts + 后端数据
- [ ] 活动记录表格展示后端真实审计数据
- [ ] Loading 骨架屏 + Error 错误处理 + Retry 重试
- [ ] 遵循 Ink & Parchment 设计系统
- [ ] 每个文件 ≤ 300 行

---

### Phase 2 — Users 列表页对接 (优先级: P0)

> **目标**: 将 `AdminUsersPageView` 从 MOCK 改为调用后端 `/api/admin/users`

#### Task 2.1: 重构用户列表页

**当前问题**:
- 使用硬编码 `MOCK_USERS` 数组
- 无分页/搜索/筛选功能
- 右侧详情面板也是 MOCK

**改造方案**:

```typescript
// AdminUsersPageView.tsx — 核心改动
import { adminFetch } from '@/services/admin.service';
import type { PaginatedUserList } from '@/types/admin';

const [data, setData] = useState<PaginatedUserList | null>(null);
const [search, setSearch] = useState('');
const [page, setPage] = useState(1);

useEffect(() => {
  const params = new URLSearchParams({ page: String(page), per_page: '20' });
  if (search) params.set('search', search);
  
  adminFetch<PaginatedUserList>(`/users?${params}`)
    .then(setData)
    .catch(console.error);
}, [page, search]);
```

#### Task 2.2: 拆分组件

| 文件 | 行数 | 职责 |
|------|------|------|
| `AdminUsersPageView.tsx` | ~200 | 数据获取、搜索/筛选控件、布局 |
| `UsersTable.tsx` (新增) | ~120 | 用户表格渲染 |
| `UserQuickPanel.tsx` (新增) | ~100 | 右侧快捷预览面板 |

#### Task 2.3: 验收标准

- [ ] 列表从后端 API 获取，支持分页
- [ ] 搜索框支持按邮箱/昵称搜索
- [ ] 会员等级筛选器工作
- [ ] 点击用户跳转详情页 (`/admin-analysis/users/[id]`)
- [ ] Loading 骨架屏 + Error 处理
- [ ] 每个文件 ≤ 300 行

---

### Phase 3 — Config 系统配置对接 (优先级: P1)

> **目标**: 将 `AdminConfigPageView` 从 MOCK 改为调用后端 `/api/admin/config`

#### Task 3.1: 扩展 Config 类型

**文件**: `frontend/src/types/admin/config.ts`

```typescript
export interface SystemConfig {
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
}

export interface ConfigListResponse {
  configs: SystemConfig[];
}

export interface ConfigUpdateRequest {
  key: string;
  value: unknown;
}
```

#### Task 3.2: 重构 Config 页面

**改造核心**:
- 删除 `MOCK DATA` 硬编码
- 从后端读取配置列表: `GET /api/admin/config`
- 保存配置变更: `PUT /api/admin/config`
- 保留 Ink & Parchment 样式

#### Task 3.3: 验收标准

- [ ] 配置项从后端读取
- [ ] 修改后可保存到后端
- [ ] 保留安全策略区域 (2FA、锁定阈值)
- [ ] 危险操作需二次确认
- [ ] 每个文件 ≤ 300 行

---

### Phase 4 — Audit 审计日志对接 (优先级: P1)

> **目标**: 将 `AdminAuditPageView` 从 MOCK 改为调用后端 `/api/admin/audit-logs`

#### Task 4.1: 扩展 Audit 类型

**文件**: `frontend/src/types/admin/audit.ts`

```typescript
export interface AuditLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PaginatedAuditList {
  data: AuditLog[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
```

#### Task 4.2: 拆分 Audit 组件

| 文件 | 行数 | 职责 |
|------|------|------|
| `AdminAuditPageView.tsx` | ~200 | 数据获取、筛选、布局 |
| `AuditDetailPane.tsx` (新增) | ~120 | JSON 详情面板 |

#### Task 4.3: 验收标准

- [ ] 审计日志从后端 API 读取
- [ ] 支持分页浏览
- [ ] 点击条目展示 JSON 详情
- [ ] 统计数字从后端聚合
- [ ] 每个文件 ≤ 300 行

---

### Phase 5 — 设计语言统一 (优先级: P1)

> **目标**: 将 Members 和 Ratings 模块从旧暗色玻璃态风格迁移到 Ink & Parchment

#### Task 5.1: Members 模块

**当前问题**:
- 使用 `bg-white/5 border-white/10 rounded-xl` 等暗色模式类名
- 自行定义了 `KpiCard`、`maskEmail`、`formatDate` (与 shared/ 重复)
- `rounded-xl` 违反 Ink & Parchment 0px 圆角规范

**改造方案**:
- 删除本地重复组件 → 导入 `features/admin/shared/`
- 替换暗色类名 → Ink & Parchment 类纸样式
- `rounded-xl` → 直角 (`rounded-none` 或移除)

#### Task 5.2: Ratings 模块

**同上问题**，需同步迁移。

#### Task 5.3: Notices 模块

**当前问题**:
- 筛选器 Select 使用 `bg-white/5 text-white` 暗色样式
- 按钮使用 `bg-indigo-600` 而非 Oxford Blue `#002045`

**改造方案**:
- Select → Ink & Parchment 风格 (白底、直角、`border-[#c4c6cf]`)
- 按钮 → `bg-[#002045]` Oxford Blue

#### 验收标准

- [ ] 所有模块视觉风格与 Dashboard 统一 (Ink & Parchment)
- [ ] 无 `rounded-xl`/`rounded-2xl` 类名 (全部直角)
- [ ] 无暗色模式类名 (`bg-white/5` 等)
- [ ] 统一使用 shared/ 组件库

---

### Phase 6 — admin.service.ts 扩展 (优先级: P0, 贯穿全流程)

> **目标**: 为每个模块的 API 调用提供类型安全的 service 函数

**文件**: `frontend/src/services/admin.service.ts`

需新增的函数：

```typescript
// Dashboard
export const getDashboardOverview = () =>
  adminFetch<DashboardOverviewResponse>('/dashboard/overview');

export const getDashboardCharts = (range: '7d' | '30d' | '90d') =>
  adminFetch<DashboardChartsResponse>(`/dashboard/charts?range=${range}`);

// Users (列表)
export const getUsers = (params: URLSearchParams) =>
  adminFetch<PaginatedUserList>(`/users?${params}`);

// Config
export const getConfigs = () =>
  adminFetch<ConfigListResponse>('/config');

export const updateConfig = (key: string, value: unknown) =>
  adminFetch<SystemConfig>('/config', {
    method: 'PUT',
    body: JSON.stringify({ key, value }),
  });

// Audit
export const getAuditLogs = (params: URLSearchParams) =>
  adminFetch<PaginatedAuditList>(`/audit-logs?${params}`);
```

> ⚠️ 拆分原则：如果 `admin.service.ts` 超过 300 行，按模块拆分为 `admin-dashboard.service.ts`、`admin-users.service.ts` 等。

---

## 四、后端 API 验证清单

在前端对接前，需确认后端 API 的 Response 格式与前端类型定义匹配：

| 后端 API | 需验证项 |
|---------|---------|
| `GET /api/admin/dashboard/overview` | 返回字段是否匹配 `DashboardOverviewResponse` |
| `GET /api/admin/dashboard/charts` | 是否支持 `range` 参数，返回格式 |
| `GET /api/admin/users` | 分页参数(`page`/`per_page`/`search`)，响应格式 |
| `GET /api/admin/config` | 返回配置列表格式 |
| `PUT /api/admin/config` | 请求/响应格式 |
| `GET /api/admin/audit-logs` | 分页参数、筛选参数、响应格式 |
| `GET /api/admin/models/status` | 返回格式 (Models 页面待确认) |

**验证方法**: 启动后端 → 访问 `http://localhost:2038/docs` (Swagger UI)

---

## 五、执行顺序与依赖关系

```
Phase 6 (service 扩展) ← 贯穿全流程
  ↓
Phase 1 (Dashboard) ← P0, 最高优先级
  ↓
Phase 2 (Users 列表) ← P0
  ↓
Phase 3 (Config) ← P1
  ↓ (可并行)
Phase 4 (Audit) ← P1
  ↓
Phase 5 (设计语言统一) ← P1, 贯穿每个 Phase
```

---

## 六、架构规范约束

| 规范 | 约束 |
|------|------|
| **文件行数** | 每个文件 ≤ 300 行，超过则拆分 |
| **组件复用** | 必须优先使用 `features/admin/shared/` 组件 |
| **API 调用** | 统一使用 `adminFetch()` 或 `admin.service.ts` 封装函数 |
| **类型安全** | 所有 API 响应必须有 TypeScript 类型定义 |
| **设计系统** | Ink & Parchment — 象牙白基底、Oxford Blue、直角、硬投影 |
| **禁止 MOCK** | 对接完成后不允许残留 `MOCK_` 数据 |
| **错误处理** | 每个页面必须有 Error 状态 + Retry 按钮 |
| **Loading** | 每个页面必须有骨架屏或 Loading 指示器 |
| **表名前缀** | 新增数据库表使用 `ss_` 前缀 |
| **字体** | Noto Serif SC (标题) + JetBrains Mono (数据/代码) |
| **图表** | 统一使用 Recharts 2.x |

---

## 七、工作量估算

| Phase | 预估工时 | 涉及文件数 |
|-------|---------|-----------|
| Phase 1 (Dashboard) | 3-4h | 5 个新增/修改 |
| Phase 2 (Users 列表) | 2-3h | 3 个新增/修改 |
| Phase 3 (Config) | 2h | 2 个修改 |
| Phase 4 (Audit) | 2-3h | 2-3 个新增/修改 |
| Phase 5 (设计统一) | 2-3h | 4-5 个修改 |
| Phase 6 (Service) | 1h | 1-2 个修改 |
| **总计** | **12-16h** | **~18 个文件** |

---
