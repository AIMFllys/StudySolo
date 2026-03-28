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

构建产物 `dist/` 通过 Nginx `alias` 指令托管：

```nginx
location ^~ /introduce/ {
    alias /www/wwwroot/studyflow.1037solo.com/introduce/dist/;
    try_files $uri $uri/ /introduce/index.html;
    expires 7d;
}
```

更新流程：

```bash
cd introduce
npm run build     # 重新构建
# Nginx 自动加载新的 dist/ 内容，无需重启
```
