#!/usr/bin/env bash
#
# sync-from-independent.sh
#
# 功能：从独立仓库拉取最新代码到 Monorepo
# 方向：独立仓库 → Monorepo
#
# 用法：
#   bash scripts/git/sync-from-independent.sh

set -euo pipefail

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# 默认路径
SOURCE="${STUDYSOLO_SOURCE:-$HOME/project/1037solo/platform.1037solo.com/StudySolo}"
TARGET="${STUDYSOLO_TARGET:-$HOME/project/Study_1037Solo/StudySolo}"

# 解析参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        --source) SOURCE="$2"; shift 2 ;;
        --target) TARGET="$2"; shift 2 ;;
        -h|--help)
            echo "StudySolo Git 同步脚本 - 独立仓库 → Monorepo (Linux/macOS)"
            echo ""
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
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

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  同步: 独立仓库 → Monorepo${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 检查路径
if [[ ! -d "$SOURCE" ]]; then
    echo -e "${RED}错误: 源路径不存在: $SOURCE${NC}" >&2
    exit 1
fi

if [[ ! -d "$TARGET" ]]; then
    echo -e "${RED}错误: 目标路径不存在: $TARGET${NC}" >&2
    exit 1
fi

# 排除项（反向同步排除 .gitmodules）
EXCLUDE_OPTS=()
for pattern in .git shared node_modules .next venv .venv __pycache__ .kiro .agent .cursor .Trae .DS_Store Thumbs.db Desktop.ini .gitmodules; do
    EXCLUDE_OPTS+=(--exclude="$pattern")
done

echo -e "${GREEN}🔄 正在复制文件...${NC}"
echo "   源: $TARGET (独立仓库)"
echo "   目标: $SOURCE (Monorepo)"
echo ""

# 使用 rsync 或 cp
if command -v rsync >/dev/null 2>&1; then
    rsync -av --delete "${EXCLUDE_OPTS[@]}" "$TARGET/" "$SOURCE/"
else
    echo -e "${YELLOW}警告: 未检测到 rsync，使用 cp 替代${NC}"
    cd "$TARGET"
    find . -not -path './.git/*' -not -name '.git' -not -name '.gitmodules' \
        -exec cp -r --parents {} "$SOURCE/" \; 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}✅ 文件同步完成！${NC}"
echo ""
echo "下一步操作建议："
echo "  1. cd $SOURCE"
echo "  2. git status    # 查看变更"
echo "  3. git add . && git commit -m \"sync: merge from independent repo\""
echo "  4. git push origin main"
echo ""
