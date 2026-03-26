# 1037solo-shared

> 最后更新：2026-03-26
> 文档编码：UTF-8（无 BOM） / LF

`shared/` 是 1037Solo 生态的共享模块，当前在 StudySolo 仓库中以 Git submodule 形式接入。

它负责三类内容：

- 共享 TypeScript 类型
- 跨项目数据库与边界规范
- Platform 与 StudySolo 的同步说明

## 1. 当前事实

- 本仓库中的 `shared/`：Git submodule
- Platform Monorepo 中的 `StudySolo/`：git subtree
- 二者不是同一件事，文档必须明确区分

## 2. 目录结构

```text
shared/
├─ AGENTS.md
├─ README.md
├─ package.json
├─ tsconfig.json
├─ docs/
│  ├─ conventions/
│  ├─ decisions/
│  ├─ guides/
│  └─ issues/
└─ src/
   ├─ index.ts
   └─ types/
      └─ database.ts
```

## 3. 共享内容范围

### 3.1 类型

`src/types/database.ts` 当前覆盖：

- 共享层用户、订阅、支付、验证码、学生认证、AI 目录
- StudySolo 工作流、对话、usage、知识库、反馈、后台配置相关表
- 遗留 Platform 表的显式 legacy 标注
- `TABLE_NAMES` 常量

### 3.2 规范

`docs/conventions/` 当前维护：

- 数据库前缀、RLS、命名与字段约束
- Platform / StudySolo 的技术边界

### 3.3 同步说明

`docs/guides/subtree-sync.md` 只描述一件事：

- Platform Monorepo 如何同步 StudySolo subtree

它不是 `shared/` 子模块的更新说明。

## 4. 接入方式

### 当前仓库中的 `shared`

本仓库通过 `.gitmodules` 引入：

```ini
[submodule "shared"]
path = shared
url = https://github.com/AIMFllys/1037solo-shared.git
```

### Platform 中的 StudySolo

Platform Monorepo 通过 `git subtree` 同步 StudySolo 主仓库代码，流程见：

- `shared/docs/guides/subtree-sync.md`

## 5. 维护原则

- 文档必须以代码、迁移和 `.gitmodules` 为准
- 中文文档统一 UTF-8（无 BOM）和 LF
- 不把 `shared` submodule 写成 subtree
- 不把 Platform 的 subtree 同步说明写成 `shared` 子模块更新流程
