#!/usr/bin/env bash
#
# sync-and-push.sh
#
# 功能：一键完成 "Monorepo → 独立仓库 → 提交推送" 全流程
# 适用场景：在 Monorepo 中改了 StudySolo 的代码，想一键推送到 AIMFllys/StudySolo
#
# 用法：
#   bash scripts/git/sync-and-push.sh
#   bash scripts/git/sync-and-push.sh --message "feat: add new feature"

set -euo pipefail

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# 默认路径（可以通过环境变量覆盖）
SOURCE="${STUDYSOLO_SOURCE:-$HOME/project/1037solo/platform.1037solo.com/StudySolo}"
TARGET="${STUDYSOLO_TARGET:-$HOME/project/Study_1037Solo/StudySolo}"
MESSAGE=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        --message|-m) MESSAGE="$2"; shift 2 ;;
        --source) SOURCE="$2"; shift 2 ;;
        --target) TARGET="$2"; shift 2 ;;
        -h|--help)
            echo "StudySolo Git 同步推送脚本 (Linux/macOS)"
            echo ""
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --message, -m MSG    自定义提交消息"
            echo "  --source PATH        源 Monorepo 路径"
            echo "  --target PATH        目标独立仓库路径"
            echo "  -h, --help           显示帮助"
            echo ""
            echo "环境变量:"
            echo "  STUDYSOLO_SOURCE     覆盖默认源路径"
            echo "  STUDYSOLO_TARGET     覆盖默认目标路径"
            exit 0
            ;;
        *) echo "未知参数: $1" >&2; exit 1 ;;
    esac
done

# 排除项
EXCLUDE_PATTERNS=(
    --exclude='.git'
    --exclude='shared'
    --exclude='node_modules'
    --exclude='.next'
    --exclude='venv'
    --exclude='.venv'
    --exclude='__pycache__'
    --exclude='.kiro'
    --exclude='.agent'
    --exclude='.cursor'
    --exclude='.Trae'
    --exclude='.DS_Store'
    --exclude='Thumbs.db'
    --exclude='Desktop.ini'
)

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  一键同步 + 推送到 AIMFllys/StudySolo${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 检查路径
if [[ ! -d "$SOURCE" ]]; then
    echo -e "${RED}错误: 源路径不存在: $SOURCE${NC}" >&2
    echo "请设置 STUDYSOLO_SOURCE 环境变量或使用 --source 选项"
    exit 1
fi

if [[ ! -d "$TARGET" ]]; then
    echo -e "${RED}错误: 目标路径不存在: $TARGET${NC}" >&2
    echo "请设置 STUDYSOLO_TARGET 环境变量或使用 --target 选项"
    exit 1
fi

# 检查 rsync
if ! command -v rsync >/dev/null 2>&1; then
    echo -e "${YELLOW}警告: 未检测到 rsync，尝试使用 cp -r 替代${NC}"
    USE_RSYNC=false
else
    USE_RSYNC=true
fi

# ---- Step 1: 复制文件 ----
echo -e "${GREEN}[1/3] 🔄 同步文件...${NC}"

if [[ "$USE_RSYNC" == "true" ]]; then
    rsync -av --delete "${EXCLUDE_PATTERNS[@]}" "$SOURCE/" "$TARGET/"
else
    # 使用 cp 的备选方案
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        EXCLUDE_CPIO+=($(echo "$pattern" | sed 's/--exclude=//'))
    done
    
    # 创建临时排除文件
    EXCLUDE_FILE=$(mktemp)
    for ex in "${EXCLUDE_CPIO[@]:-}"; do
        echo "$ex" >> "$EXCLUDE_FILE"
    done
    
    cd "$SOURCE"
    find . -type f | grep -v -f "$EXCLUDE_FILE" | cpio -pdm "$TARGET" 2>/dev/null || {
        # 更简单的备选方案
        rm -rf "$TARGET"/* "$TARGET"/.* 2>/dev/null || true
        cp -r "$SOURCE"/* "$TARGET/" 2>/dev/null || true
    }
    rm -f "$EXCLUDE_FILE"
fi

echo -e "${GREEN}   ✅ 文件同步完成${NC}"

# ---- Step 2: 暂存变更 ----
echo ""
echo -e "${GREEN}[2/3] 📋 检查变更...${NC}"

cd "$TARGET"

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet && [[ -z $(git status --porcelain) ]]; then
    echo -e "${YELLOW}   ℹ️  没有检测到变更，无需推送。${NC}"
    exit 0
fi

echo -e "${YELLOW}   检测到以下变更：${NC}"
git status --short

# 获取提交消息
if [[ -z "$MESSAGE" ]]; then
    read -p "请输入提交消息 (直接回车使用默认): " MESSAGE
    if [[ -z "$MESSAGE" ]]; then
        TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
        MESSAGE="sync: update from monorepo ($TIMESTAMP)"
    fi
fi

# ---- Step 3: 提交推送 ----
echo ""
echo -e "${GREEN}[3/3] 🚀 提交并推送...${NC}"
echo "   消息: $MESSAGE"

git add .
git commit -m "$MESSAGE" || true
git push origin main || git push origin master || {
    echo -e "${RED}❌ 推送失败${NC}" >&2
    exit 1
}

echo ""
echo -e "${GREEN}✅ 全部完成！已推送到 AIMFllys/StudySolo${NC}"
echo ""
