# StudySolo Subtree 同步指南

> 最后更新：2026-04-12
> 文档编码：UTF-8（无 BOM） / LF

本文档只描述一件事：

- Platform Monorepo 如何同步 StudySolo 主仓库代码

它不描述 `shared/` 子模块的更新流程。

## 1. 同步对象

GitHub 关系：

```text
AIMFllys/StudySolo        -> StudySolo 主仓库
AIMFllys/1037Solo         -> Platform Monorepo（其中包含 StudySolo/ subtree）
```

## 2. 什么时候用 subtree

在 Platform Monorepo 中需要更新 `StudySolo/` 目录时，使用 subtree。

```bash
git subtree pull --prefix=StudySolo https://github.com/AIMFllys/StudySolo.git main --squash
```

## 3. 什么时候不是 subtree

以下场景都不是 subtree：

- 更新当前仓库中的 `shared/`
- 调整 `.gitmodules`
- 更新 `shared` 子模块指针

这些属于 submodule 维护。

## 4. 推荐流程

### 4.1 StudySolo 主仓库日常开发

```bash
cd /path/to/StudySolo
git add .
git commit -m "feat: ..."
git push origin main
```

### 4.2 Platform Monorepo 同步 StudySolo

```bash
cd /path/to/1037Solo
git subtree pull --prefix=StudySolo https://github.com/AIMFllys/StudySolo.git main --squash
git push origin main
```

## 5. 同步注意事项

- 先确保 StudySolo 主仓库已经推送到远端
- 不要把 `shared` 子模块更新和 subtree pull 混在同一个概念里
- 文档中出现 “subtree version lag” 时，默认讨论的是 Platform Monorepo 里的 `StudySolo/` 目录
