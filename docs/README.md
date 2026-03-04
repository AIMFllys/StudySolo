<!-- 编码：UTF-8 -->

# 📁 项目文档总览

这里存放所有非前后端代码的规范文档，包括部署指南、AI 编程总结、更新日志、规划等。

> **📌 共享 Supabase 数据库规范**：本项目与 1037Solo Platform 共享同一个 Supabase Project（`hofcaclztjazoytmckup`）。  
> 核心规范文件位于 `Plans/daily_plan/user_auth/07-shared-supabase-database-convention.md`。

## 目录结构

```
docs/
├── README.md             ← 本文件：文档目录总览
├── architecture.md       ← 项目地图（技术栈·模块划分·数据流向）
├── naming.md             ← 命名规范（变量·文件·API字段·数据库表名前缀）
├── frontend-engineering-spec.md ← 前端工程规范（分层·行数·拆分策略）
├── api.md                ← 接口契约（请求·响应·鉴权·端点列表）
├── progress.md           ← 开发进度
│
├── Plans/
│   ├── PROJECT_PLAN.md   ← 项目整体规划方案 v3
│   ├── StudySolo-MVP.md  ← MVP 任务规划（13天冲刺）
│   ├── global/           ← 🌐 全局规划（项目深度功能规划 · 全景视图）
│   ├── daily_plan/       ← 每日计划（按功能模块分子目录）
│   │   ├── user_auth/    ← 用户认证相关规划
│   │   │   ├── 07-shared-supabase-database-convention.md ← 🔑 **共享 Supabase 数据库规范**
│   │   │   ├── 04-sso-cross-project-auth.md
│   │   │   ├── vip-01-membership-system-design.md
│
├── Plans/
│   ├── PROJECT_PLAN.md   ← 项目整体规划方案 v3
│   ├── StudySolo-MVP.md  ← MVP 任务规划（13天冲刺）
│   ├── global/           ← 🌐 全局规划（项目深度功能规划 · 全景视图）
│   ├── daily_plan/       ← 每日计划（按功能模块分子目录）
│   │   ├── user_auth/    ← 用户认证相关规划
│   │   │   ├── 07-shared-supabase-database-convention.md ← 🔑 **共享 Supabase 数据库规范**
│   │   │   ├── 04-sso-cross-project-auth.md
│   │   │   ├── vip-01-membership-system-design.md
│   │   │   └── ...
│   │   ├── core/         ← 核心功能规划
│   │   ├── workflow_canvas/ ← 画布编辑器规划
│   │   └── admin/        ← 管理后台规划
│   └── accumulate_plan/  ← 长期积累性规划与创意池
│
├── Updates/              ← 更新日志（按日期·对标 1037solo 规范）
├── summary/              ← AI 编程总结（预分类汇总重构与实现细节）
├── Source/               ← 规范来源文件暂存（学长分享的核心规范）
├── backup/               ← 备份文件
├── 详细指南/              ← 操作手册（宝塔部署等）
└── 技术指导/              ← 深度技术指导文档
    ├── 核心工作流AI交互深度技术指导/
    └── 混合RAG知识库技术指导/
```

---

## 🗄️ 共享数据库规范速查

> 本项目与 1037Solo Platform 共享同一个 Supabase Project（`hofcaclztjazoytmckup`）

| 前缀 | 归属 | 示例 |
|:---|:---|:---|
| **无前缀** | 共享表 | `user_profiles`, `subscriptions`, `verification_codes_v2` |
| **`ss_`** | StudySolo 专属 | `ss_workflows`, `ss_workflow_runs`, `ss_usage_daily` |
| **`pt_`** | Platform 专属 | `pt_conversations`, `pt_messages`, `pt_ai_models` |

详见：[共享 Supabase 数据库规范](Plans/daily_plan/user_auth/07-shared-supabase-database-convention.md)

---

## 核心规范文档

| 文档 | 说明 |
|------|------|
| [architecture.md](architecture.md) | 项目地图：技术栈选型、模块划分、数据流向 |
| [naming.md](naming.md) | 命名规范：变量、文件、API 字段、**数据库表名前缀** |
| [frontend-engineering-spec.md](frontend-engineering-spec.md) | 前端工程规范：分层边界、**单文件 ≤ 300 行**、拆分治理流程 |
| [api.md](api.md) | 接口契约：请求/响应格式、鉴权方式、端点列表 |
| [progress.md](progress.md) | 开发进度与当前状态 |
| [Plans/daily_plan/user_auth/07-shared-supabase-database-convention.md](Plans/daily_plan/user_auth/07-shared-supabase-database-convention.md) | **🔑 共享 Supabase 数据库规范**（跨项目核心） |

---

## 节点开发文档

| 文档 | 说明 |
|------|------|
| [../backend/app/nodes/CONTRIBUTING.md](../backend/app/nodes/CONTRIBUTING.md) | **📖 节点开发指南**：新增工作流节点的完整操作手册（7 步流程 + 3 种模板 + Checklist + FAQ） |

> 💡 **新增节点只需 3 步**：
> 1. 后端：创建 `nodes/<分类>/<节点名>/` 文件夹（`node.py` + `prompt.md`）
> 2. 配置：在 `config.yaml` 的 `node_routes` 添加路由
> 3. 前端：在 `nodes/index.ts` 的 `RENDERER_REGISTRY` 添加渲染器映射

---

## 📝 阶段总结 (Summary)

记录核心架构演进和各阶段重构的详细总结，更多详情请查阅 [summary/README.md](summary/README.md)。

| 文档分类 | 文档链接 | 核心内容说明 |
|:---|:---|:---|
| **🏗️ 后端与引擎架构** | [工作流引擎重构总结](summary/2026-03-04-workflow-engine-refactor-summary.md) | **引擎解耦重构**：拓扑分层并行执行、多节点生态扩展、知识库子系统、流式输出优化 |
| **🎨 前端与工程化** | [前端全量重构总结](summary/2026-03-04-frontend-full-refactor-summary.md) | **全量模块化重构**：组件代码收敛(≤300行)、业务副作用下沉hooks、严格测试与构建门禁 |

---

*StudySolo Development Team · 最后更新：2026-03-04*
