# StudySolo Introduce

> 产品介绍页 — Vite + React 静态 SPA

## 概述

这是 StudySolo 平台的**独立产品介绍页面**，用于展示平台功能亮点和使用引导。采用 Vite + React 构建为纯静态 SPA，部署时由 Nginx 直接托管静态文件，无需 Node.js 运行时。

- 🌐 线上地址：`https://studyflow.1037solo.com/introduce/`

## 技术栈

| 维度 | 选型 |
| :--- | :--- |
| **构建工具** | Vite 7 |
| **框架** | React 19 + TypeScript |
| **部署方式** | Nginx alias 静态托管 |

## 快速启动

```bash
npm install
npm run dev       # 本地开发服务器
npm run build     # 构建产物输出到 dist/
npm run preview   # 预览构建产物
```

## 项目结构

```text
introduce/
├── src/              # 源代码
├── public/           # 静态资源
├── dist/             # 构建产物（Nginx 直接托管此目录）
├── index.html        # 入口 HTML
├── vite.config.ts    # Vite 配置
├── package.json
└── tsconfig.json
```

## 生产部署

### 目录与 Nginx 必须一致（C-09）

线上**物理路径**必须与 Nginx `alias` 指向的目录**同构**：`index.html` 与 `assets/` 必须来自**同一次** `npm run build` 输出的 `dist/`，并整体同步到服务器，例如：

```text
.../introduce/dist/
  index.html
  assets/index-<hash>.js
  assets/index-<hash>.css
  StudySolo.png
```

仓库内 `npm run build` 会在末尾执行 `scripts/verify-dist.mjs`，若 `index.html` 引用的带哈希文件在 `dist/` 中不存在会直接失败，避免带病发布。

### 白屏 + `index-xxxx.js` 404 的常见根因

1. **只上传了部分文件**：`index.html` 已更新引用新的哈希，但 `assets/` 未同步 → 浏览器请求旧 URL 或新哈希文件不存在。
2. **`index.html` 被长期缓存**：Nginx/CDN 对整站 `expires 7d` 时，用户仍持有**旧** HTML，其中引用的 `index-OLD.js` 已被新部署删除 → 404 + 白屏。**勿对 HTML 设长缓存**；带哈希的 `assets/*` 可长期缓存。
3. **`alias` 路径错误**：`location` 与 `alias` 尾部斜杠不成对，或 `alias` 未指向 `dist/`（见 `docs/.../C-nginx-deploy.md` C-01、C-09）。

### 推荐 Nginx 片段

见同目录 **`nginx-introduce.example.conf`**（`assets/` 长期缓存 + 其余 `no-cache`，避免陈旧入口 HTML）。

更新流程（建议整目录原子替换）：

```bash
cd introduce
npm run build     # 含 dist 校验；通过后再同步 dist/
# 将服务器上 introduce/dist 整体替换为新 dist（勿只替换 index.html）
# nginx -s reload  # 若改动了 include 配置
```

线上排障请同时核对：`nginx -T`、`curl -I https://studyflow.1037solo.com/introduce/assets/<当前哈希>.js`、`ls` 服务器 `dist` 目录。
