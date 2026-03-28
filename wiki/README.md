# StudySolo Wiki

> 官方文档站 — Next.js（开发中）

## 概述

StudySolo 官方文档站点，用于承载用户指南、API 文档、常见问题解答和开发者文档。

- 🌐 规划线上地址：`https://studyflow.1037solo.com/wiki/`
- 📌 当前状态：**开发中，尚未初始化**

## 规划技术栈

| 维度 | 选型 |
| :--- | :--- |
| **框架** | Next.js (App Router) |
| **内容** | MDX / Markdown |
| **端口** | 2039（预留） |
| **部署方式** | PM2 守护进程 + Nginx 反代 |

## 规划目录结构

```text
wiki/
├── src/
│   ├── app/                  # Next.js 路由
│   └── content/              # Markdown/MDX 文档源文件
├── public/                   # 静态资源
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 初始化（待执行）

```bash
cd wiki
npx -y create-next-app@latest ./ --ts --app --tailwind --eslint --src-dir
```

## Nginx 预留配置

Wiki 的 Nginx 路由已在主配置中预留（注释状态），启用时取消注释即可：

```nginx
location ^~ /wiki/ {
    proxy_pass http://127.0.0.1:2039;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
