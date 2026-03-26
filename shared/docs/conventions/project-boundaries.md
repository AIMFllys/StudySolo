# 项目边界规范

> 最后更新：2026-03-26
> 文档编码：UTF-8（无 BOM） / LF

本文档用于避免把 Platform、StudySolo、`shared` 三者的边界写混。

## 1. 项目对照

| 维度 | Platform | StudySolo |
| --- | --- | --- |
| 前端 | React + Vite | Next.js 16.1.6 + React 19.2.3 |
| 后端 | Node / Express 体系 | FastAPI |
| 认证 | 遗留 session / bcrypt 体系 | Supabase Auth + JWT |
| 用户业务表 | Platform legacy 表 | `user_profiles` |
| 默认前端端口 | 3037 | 2037 |
| 默认后端端口 | 3038 | 2038 |

## 2. shared 与 subtree 的边界

### 当前 StudySolo 仓库

- `shared/` 是 Git submodule
- 通过 `.gitmodules` 管理

### Platform Monorepo

- `StudySolo/` 是 git subtree
- 用于把 StudySolo 主仓库代码同步进 Platform Monorepo

## 3. StudySolo 侧禁止事项

- 使用 Platform legacy 用户表作为正式用户模型
- 把 `shared/` 写成 subtree
- 把 `selected_platform + selected_model` 写成新的主选型字段
- 把 `*_usd` 写成新的正式金额字段

## 4. 共享文档规则

- 共享文档只能写跨项目稳定事实
- 单项目运行时实现细节应放回项目文档
- 边界文档必须同时指出：
  - `shared` 在当前仓库中的 submodule 身份
  - Platform 中 StudySolo 的 subtree 身份
