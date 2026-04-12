# Issue 001：Platform 中 StudySolo subtree 版本滞后

> 最后更新：2026-04-12
> 状态：已知风险
> 文档编码：UTF-8（无 BOM） / LF

## 1. 问题定义

本问题只讨论：

- Platform Monorepo 中 `StudySolo/` subtree 落后于 StudySolo 主仓库

本问题不讨论：

- 当前仓库中的 `shared/` 子模块

## 2. 常见表现

- Platform Monorepo 内的 `StudySolo/` 代码仍引用旧表名或旧字段
- 平台侧文档或脚本仍基于过期的 StudySolo 结构
- 主仓库已修复的问题在 Monorepo 中仍然复现

## 3. 处理方式

在 Platform Monorepo 中执行：

```bash
git subtree pull --prefix=StudySolo https://github.com/AIMFllys/StudySolo.git main --squash
```

## 4. 检查清单

- Platform 中的 `StudySolo/` 是否已同步到最新主仓库提交
- API 路由、表名和字段是否与 StudySolo 主仓库一致
- 不要把这类版本滞后误归因到 `shared` submodule
