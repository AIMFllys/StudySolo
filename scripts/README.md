<!-- 编码：UTF-8 -->

# scripts/ — StudySolo 自动化脚本中心

> 最后更新：2026-04-17

本目录是 StudySolo 项目的自动化枢纽，涵盖本地开发启动、生产部署、Git 同步，以及日志/临时文件的统一存放。

## 目录结构

```text
scripts/
├── start-studysolo.ps1       # ⭐ Windows 一键全栈启动（常用，留在根目录）
├── start-studysolo           # ⭐ 跨平台启动入口（自动检测系统）
│
├── startup/                  # 启动脚本
│   ├── start-studysolo.ps1   # Windows 全栈启动（与根目录版本同步）
│   └── start-studysolo.sh    # Linux/macOS 一键全栈启动
│
├── deploy/                   # 部署脚本 & 生产配置
│   ├── deploy-backend.sh     # 后端部署 (Gunicorn + Swap)
│   ├── deploy-frontend.sh    # 前端部署 (PM2 + Next.js)
│   └── nginx.conf            # Nginx 反向代理 & SSL 配置
│
├── git/                      # Git 仓库同步脚本（跨平台）
│   ├── sync-and-push.ps1     # ⭐ Windows: 一键同步 + 提交 + 推送
│   ├── sync-and-push.sh      # ⭐ Linux/macOS: 一键同步 + 提交 + 推送
│   ├── sync-to-independent.ps1
│   ├── sync-to-independent.sh
│   ├── sync-from-independent.ps1
│   ├── sync-from-independent.sh
│   ├── 一键git.ps1
│   └── README.md
│
├── diagnostics/              # ⭐ 系统一键诊断脚本（跨平台）
│   ├── run-diagnostics.ps1   # Windows（UTF-8 with BOM）
│   ├── run-diagnostics.sh    # Linux/macOS
│   ├── run_diagnostics.py    # 跨平台 CLI fallback
│   └── README.md
│
├── logs/                     # 运行日志（已 gitignore）
├── temp/                     # 临时输出文件（已 gitignore）
├── sandbox/                  # 临时测试脚本（已 gitignore）
└── README.md                 # ← 你在这里
```

## 脚本说明

### 本地开发启动

| 脚本 | 平台 | 位置 | 说明 |
|------|------|------|------|
| `start-studysolo.ps1` | Windows | `scripts/` | 原生 PowerShell 脚本 |
| `start-studysolo` | 跨平台 | `scripts/` | ⭐ 自动检测系统，推荐入口 |
| `start-studysolo.sh` | Linux/macOS | `scripts/startup/` | 原生 Bash 脚本 |

三个脚本功能一致：自动检测端口占用 → 启动后端 Uvicorn (2038) + 前端 Next.js (2037)。

```powershell
# Windows（PowerShell）
.\scripts\start-studysolo.ps1

# Linux/macOS（Bash）
bash scripts/startup/start-studysolo.sh

# 跨平台通用入口（推荐）
./scripts/start-studysolo        # 自动检测系统
```

### 生产部署（scripts/deploy/）

| 脚本 | 功能 |
|------|------|
| `deploy-backend.sh` | 拉取代码 → 安装依赖 → 重启 Gunicorn (2 workers, port 2038)，含 2GB Swap 配置 |
| `deploy-frontend.sh` | 拉取代码 → pnpm install → pnpm build → 重启 PM2 (port 2037) |
| `nginx.conf` | 反向代理配置：`/api/*` → 2038，`/` → 2037，含 SSL/SSE/安全头 |

### Git 同步（scripts/git/）

详见 [git/README.md](git/README.md)。用于 Monorepo ↔ StudySolo 独立仓库之间的代码同步。

**Windows:**
```powershell
# 一键同步 + 推送
powershell -ExecutionPolicy Bypass -File "scripts\git\sync-and-push.ps1"
```

**Linux/macOS:**
```bash
# 一键同步 + 推送
bash scripts/git/sync-and-push.sh

# 自定义路径
STUDYSOLO_SOURCE=/path/to/source STUDYSOLO_TARGET=/path/to/target bash scripts/git/sync-and-push.sh
```

### 系统诊断（scripts/diagnostics/）

一键测试所有 AI 模型 / 子 Agents / 数据库 / 内部服务，日志统一落盘到 `scripts/logs/`。详见 [diagnostics/README.md](diagnostics/README.md)。

```powershell
# Windows（推荐）
$env:STUDYSOLO_ADMIN_TOKEN = "<your-admin-jwt>"
.\scripts\diagnostics\run-diagnostics.ps1

# Linux/macOS
bash scripts/diagnostics/run-diagnostics.sh
```

退出码：`0=全健康 / 1=有故障 / 2=脚本异常`，适合 CI 健康门禁。

## 临时目录约定

| 目录 | 用途 | Git 状态 |
|------|------|----------|
| `logs/` | 运行日志、调试记录、AI Agent 执行日志 | gitignore（仅保留目录） |
| `temp/` | 临时输出文件（txt、csv、json 等中间产物） | gitignore（仅保留目录） |
| `sandbox/` | 临时测试脚本（Python/Shell 等一次性验证代码） | gitignore（仅保留目录） |

这三个目录通过 `.gitkeep` + `.gitignore` 保持目录结构存在但不追踪内容文件。

### 使用示例

```bash
# 在 sandbox 中写一个快速验证脚本
python scripts/sandbox/test_api_response.py

# 将临时输出写到 temp
python -c "print('hello')" > scripts/temp/output.txt

# Agent 调试日志写到 logs
# （workspace rule: 临时日志放 scripts/logs/）
```

## 端口约定

| 服务 | 端口 | 进程管理 |
|------|------|----------|
| Next.js 前端 | 2037 | PM2 (生产) / next dev (开发) |
| FastAPI 后端 | 2038 | Gunicorn (生产) / Uvicorn (开发) |
