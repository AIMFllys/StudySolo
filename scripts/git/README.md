# 📦 Git 同步脚本

跨平台脚本集合，用于在 Monorepo 和 StudySolo 独立仓库之间同步代码。

## 脚本列表

### Windows (PowerShell)

| 脚本 | 方向 | 用途 |
|------|------|------|
| `sync-to-independent.ps1` | Monorepo → 独立仓库 | 将改动复制到独立仓库（不自动提交） |
| `sync-from-independent.ps1` | 独立仓库 → Monorepo | 拉取独立仓库的最新代码到 Monorepo |
| `sync-and-push.ps1` | Monorepo → 独立仓库 → GitHub | ⭐ **一键同步 + 提交 + 推送** |
| `一键git.ps1` | - | 一体化 Git 管理工具 |

### Linux/macOS (Bash)

| 脚本 | 方向 | 用途 |
|------|------|------|
| `sync-to-independent.sh` | Monorepo → 独立仓库 | 将改动复制到独立仓库（不自动提交） |
| `sync-from-independent.sh` | 独立仓库 → Monorepo | 拉取独立仓库的最新代码到 Monorepo |
| `sync-and-push.sh` | Monorepo → 独立仓库 → GitHub | ⭐ **一键同步 + 提交 + 推送** |

## 使用方式

### Windows

```powershell
# 方式 1：最常用 — 一键推送
powershell -ExecutionPolicy Bypass -File "StudySolo\scripts\git\sync-and-push.ps1"

# 方式 2：带自定义提交消息
powershell -ExecutionPolicy Bypass -File "StudySolo\scripts\git\sync-and-push.ps1" -Message "feat: add new feature"

# 方式 3：只复制不提交
powershell -ExecutionPolicy Bypass -File "StudySolo\scripts\git\sync-to-independent.ps1"

# 方式 4：从独立仓库拉取
powershell -ExecutionPolicy Bypass -File "StudySolo\scripts\git\sync-from-independent.ps1"
```

### Linux/macOS

```bash
# 方式 1：最常用 — 一键推送
bash scripts/git/sync-and-push.sh

# 方式 2：带自定义提交消息
bash scripts/git/sync-and-push.sh --message "feat: add new feature"

# 方式 3：自定义路径
STUDYSOLO_SOURCE=/path/to/monorepo STUDYSOLO_TARGET=/path/to/repo bash scripts/git/sync-and-push.sh

# 方式 4：只复制不提交
bash scripts/git/sync-to-independent.sh

# 方式 5：从独立仓库拉取
bash scripts/git/sync-from-independent.sh
```

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `STUDYSOLO_SOURCE` | Monorepo 源路径 | `~/project/1037solo/platform.1037solo.com/StudySolo` |
| `STUDYSOLO_TARGET` | 独立仓库目标路径 | `~/project/Study_1037Solo/StudySolo` |

## 自动排除的内容

| 排除项 | 原因 |
|--------|------|
| `.git/` | 各仓库有独立的 Git 历史 |
| `shared/` | 各自有独立的 Git Submodule |
| `node_modules/` | 应在目标重新安装 |
| `.next/` | Next.js 构建缓存 |
| `venv/` `.venv/` | Python 虚拟环境 |
| `__pycache__/` | Python 编译缓存 |
| `.kiro/` `.agent/` `.cursor/` `.Trae/` | AI 工具配置 |
| `.gitmodules` | 反向同步时排除（仅 `sync-from-independent`） |
