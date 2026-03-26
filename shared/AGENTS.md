# AI Agent Context — 1037Solo Shared Module

> 本文件是所有 AI 助手在 1037Solo 生态中工作时的**强制上下文**。
> 无论你在 Platform 还是 StudySolo 中工作，此文件所述规则必须遵守。
> **最后更新: 2026-03-24**

---

## ⚠️ 核心规则

### 1. 这个仓库包含两个完全独立的子项目

| 项目 | 代码位置 | 前端 | 后端 | 认证方式 |
|------|---------|------|------|---------| 
| **Platform** | `home/` | React 19 + Vite + Tailwind v3 | Express.js (Node.js) | 自建 bcrypt + session |
| **StudySolo** | `StudySolo/` 或独立仓库 | Next.js 16 + Tailwind v4 | FastAPI (Python 3.11+) | Supabase Auth (JWT) |

### 2. 共享 Supabase 数据库（同一个实例）

- **Project ID**: `hofcaclztjazoytmckup`
- **URL**: `https://hofcaclztjazoytmckup.supabase.co`

#### 表名前缀规则（必须遵守）

| 前缀 | 归属 | 示例 |
|------|------|------|
| 无前缀 | 共享表 | `user_profiles`, `subscriptions`, `addon_purchases`, `payment_records`, `verification_codes_v2` |
| `ss_` | StudySolo 专属 | `ss_workflows`, `ss_workflow_runs`, `ss_usage_daily` |
| `pt_` | Platform 专属（待迁移） | 当前仍为旧名 `users`, `conversations`, `messages` |

#### 用户数据架构

```
auth.users (Supabase 内置)
    ↓ 1:1 (trigger: handle_new_user)
user_profiles (共享业务表, UUID id)
    ↓ 1:N
ss_workflows / pt_conversations 等 (各自业务表)
```

### 3. 认证系统完全不同

#### Platform 认证
- 方式: 自建 bcrypt + 自建 session token
- Cookie: `auth_token`
- 用户表: `users` (TEXT id, password_hash 字段) — 旧架构
- 代码: `home/server/solo-api/src/routes/auth.js`

#### StudySolo 认证
- 方式: Supabase Auth (JWT)
- Cookie: `access_token` + `refresh_token`
- 用户表: `user_profiles` (UUID id, 外键→auth.users) — **不是 `users` 表！**
- 后端: `backend/app/api/auth/` (login, register, captcha)
- 前端: `frontend/src/utils/supabase/client.ts`
- Admin: 独立 JWT 认证体系 (`backend/app/middleware/admin_auth.py`)

### 4. 端口分配

| 项目 | 前端 | 后端 |
|------|------|------|
| Platform | 3037 | 3038 |
| StudySolo | 2037 | 2038 |

### 5. Cookie Domain (SSO)

- 生产环境：`.1037solo.com`（跨子域共享）
- 本地开发：不配置 domain

---

## 🚫 绝对禁止

### 在 Platform 代码中

- ❌ 使用 `db.auth.sign_in` / `db.auth.sign_up` (Supabase Auth API)
- ❌ 引用 `user_profiles` 表
- ❌ 引用 `ss_*` 前缀的表
- ❌ 引用 `StudySolo/` 目录下的文件
- ❌ 使用 Tailwind v4 CSS-first 语法
- ❌ 使用 pnpm

### 在 StudySolo 代码中

- ❌ 使用 bcrypt / 自建 session 认证
- ❌ 引用 `users` 表 (那是 Platform 旧表，结构完全不同)
- ❌ 引用 `pt_*` 前缀的表
- ❌ 引用 `home/` 目录下的文件
- ❌ 使用 Tailwind v3 JS 配置语法
- ❌ 使用 npm (StudySolo 用 pnpm)

---

## 📐 RLS (Row Level Security) 规则

- **Platform**: 未启用 RLS，service_role 直接查询
- **StudySolo**: 已启用 RLS，所有 Policy 使用 `(select auth.uid())` 语法
- **新建表**: 必须启用 RLS

---

## 🤖 StudySolo AI 系统概览 (2026-03-24 更新)

StudySolo 内嵌了一个 **模式驱动的 AI 聊天系统** (`SidebarAIPanel`)：

### 三种模式

| 模式 | 能力 | 输出格式 |
|------|------|---------|
| **Chat** (对话) | 只能看画布，不能改 | Markdown (流式) |
| **Plan** (规划) | 分析画布 + 给建议 | XML (流式) |
| **Create** (创建) | 直接操作画布节点 | JSON 指令 (一次性) |

### 四种意图

| 意图 | 触发条件 | AI 动作 |
|------|---------|--------|
| **BUILD** | 画布为空 + 学习目标 | 全量生成工作流 |
| **MODIFY** | 画布有节点 + 修改动词 | 返回 JSON 操作指令 |
| **CHAT** | 问题/闲聊 | 文字回答 |
| **ACTION** | 运行/保存/导出 | 触发系统动作 |

### Prompt 架构

```
backend/app/prompts/
├── identity.md              ← 所有模式共享的身份设定
├── intent_classifier.md     ← 意图分类器
├── mode_chat.md             ← Chat 模式提示词
├── mode_plan.md             ← Plan 模式提示词 (XML 输出)
├── mode_create.md           ← Create 模式提示词 (JSON 工具调用)
└── prompt_loader.py         ← Markdown 模板引擎 (LRU 缓存 + {{变量}} 渲染)
```

### 管理后台 API (10 模块)

```
/api/admin/auth       ← Admin JWT 认证
/api/admin/dashboard  ← 仪表盘 (用户统计、工作流运行、AI 调用、Token 用量)
/api/admin/users      ← 用户管理 (查看、封禁、修改会员)
/api/admin/workflows  ← 工作流管理 (查看、统计)
/api/admin/audit      ← 审计日志
/api/admin/config     ← 系统配置
/api/admin/members    ← 会员管理
/api/admin/models     ← AI 模型配置
/api/admin/notices    ← 公告管理
/api/admin/ratings    ← 评分管理
```

---

## 📁 本模块结构

```
1037solo-shared/
├── AGENTS.md                  ← 本文件 (AI 强制上下文)
├── README.md                  ← 模块说明
├── package.json               ← npm 包定义
├── docs/
│   ├── conventions/           ← 📐 跨项目规范
│   │   ├── database.md        │  数据库命名 + 建表检查清单
│   │   └── project-boundaries.md │ 项目技术栈边界
│   ├── decisions/             ← 📋 决策日志
│   │   └── log.md
│   ├── guides/                ← 📖 操作指南
│   │   └── subtree-sync.md
│   └── issues/                ← 🚨 待处理问题
│       └── 001-subtree-version-lag.md
└── src/
    └── types/
        └── database.ts        ← 数据库表的 TypeScript 类型定义
```
