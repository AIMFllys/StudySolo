# 🔗 1037solo-shared — 跨项目共享模块

> **用途**: Platform 和 StudySolo 之间的共享规范、类型定义和文档
> **引入方式**: Git Submodule
> **维护者**: 1037Solo Development Team
> **最后更新**: 2026-03-24

---

## 为什么需要这个仓库？

1037Solo 生态包含两个独立开发的子项目（Platform + StudySolo），它们共享同一个 Supabase 数据库。为了确保：
- AI 助手在任一项目中都能获得完整上下文
- 数据库表名前缀、认证模式等规范始终同步
- TypeScript 类型定义跨项目统一

我们将共享内容提取为一个独立仓库，通过 Git Submodule 机制同时链接到两个项目中。

---

## 目录结构

```
1037solo-shared/
├── AGENTS.md              ← ⭐ AI 强制上下文 (两边的 AI 都会读到)
├── README.md              ← 本文件
├── package.json
├── tsconfig.json
├── docs/                  ← 跨项目文档
│   ├── conventions/       ← 📐 必须遵守的规范
│   │   ├── database.md    │  数据库命名 + 建表检查清单
│   │   └── project-boundaries.md │ 项目技术栈边界
│   ├── decisions/         ← 📋 决策日志
│   │   └── log.md
│   ├── guides/            ← 📖 操作指南
│   │   └── subtree-sync.md
│   └── issues/            ← 🚨 待处理问题
│       └── 001-subtree-version-lag.md
└── src/
    ├── index.ts           ← 导出入口
    └── types/
        └── database.ts    ← 共享表 Schema 类型定义
```

---

## 核心内容概览

### AGENTS.md (AI 强制上下文)

- 两个子项目的技术栈差异 (Next.js vs React+Vite, FastAPI vs Express)
- 表名前缀规则 (`ss_` / `pt_` / 无前缀)
- 认证系统差异 (Supabase Auth vs bcrypt)
- 端口分配 (StudySolo: 2037/2038, Platform: 3037/3038)
- 绝对禁止事项 (跨项目引用)
- StudySolo AI 聊天系统概览 (三模式四意图)
- 管理后台 API (10 模块)

### database.ts (TypeScript 类型定义)

**共享表** (无前缀):
- `UserProfile` — 用户业务信息 (UUID, tier, is_student_verified)
- `Subscription` — 订阅信息 (tier, status, period)
- `AddonPurchase` — 加油包购买记录
- `PaymentRecord` — 支付记录
- `VerificationCodeV2` — 验证码 (register/reset/login)

**StudySolo 专属** (ss_ 前缀):
- `SsWorkflow` — 工作流 (nodes_json, edges_json, status)
- `SsWorkflowRun` — 运行记录 (duration_ms, tokens_used)
- `SsUsageDaily` — 每日用量统计

**Platform 旧表** (待迁移):
- `PlatformLegacyUser` — 旧用户表 (TEXT id, password_hash)

**表名常量**:
- `TABLE_NAMES` 对象，确保查询时使用常量而非硬编码字符串

---

## 在消费项目中的使用

### 作为 Git Submodule 引入

已在以下项目中引入：
- `AIMFllys/1037Solo` (Platform Monorepo) → `shared/`
- `AIMFllys/StudySolo` (独立仓库) → `shared/`

### 引用类型定义

```typescript
// Platform (home/) 中引用
import type { UserProfile, SsWorkflow } from '../shared/src/types/database';

// StudySolo (frontend/) 中引用
import type { UserProfile, SsWorkflow } from '../shared/src/types/database';

// 使用表名常量
import { TABLE_NAMES } from '../shared/src/types/database';
const { data } = await supabase.from(TABLE_NAMES.SS_WORKFLOWS).select('*');
```

---

## 日常维护

### 修改共享内容

```bash
# 1. 进入 shared 子目录
cd shared

# 2. 修改文件
# ... edit files ...

# 3. 提交并推送（是独立仓库！）
git add .
git commit -m "docs: update database convention"
git push origin main

# 4. 回到主项目，更新 submodule 指针
cd ..
git add shared
git commit -m "chore: update shared submodule"
```

### 拉取最新共享内容

```bash
# 在任一消费项目中
git submodule update --remote shared
git add shared
git commit -m "chore: sync shared submodule to latest"
```

---

*最后更新：2026-03-24*
