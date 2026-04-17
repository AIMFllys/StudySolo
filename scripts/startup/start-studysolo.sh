#!/usr/bin/env bash
# StudySolo 全栈本地开发启动神器 (Linux/macOS)
# 镜像 start-studysolo.ps1 的行为
#
# 用法:
#   ./scripts/startup/start-studysolo.sh
#   ./scripts/startup/start-studysolo.sh --no-agents
#   ./scripts/startup/start-studysolo.sh --backend-port 2038 --frontend-port 2037

set -euo pipefail

# 默认配置
BACKEND_PORT=2038
FRONTEND_PORT=2037
START_AGENTS=true
AUTO_INSTALL_DEPS=true

# 颜色定义
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
DARK_GRAY='\033[1;30m'
NC='\033[0m'

# 解析参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        --backend-port) BACKEND_PORT="$2"; shift 2 ;;
        --frontend-port) FRONTEND_PORT="$2"; shift 2 ;;
        --no-agents) START_AGENTS=false; shift ;;
        --no-auto-install) AUTO_INSTALL_DEPS=false; shift ;;
        -h|--help)
            echo "StudySolo 全栈启动脚本 (Linux/macOS)"
            echo ""
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --backend-port PORT     后端端口 (默认: 2038)"
            echo "  --frontend-port PORT    前端端口 (默认: 2037)"
            echo "  --no-agents             跳过启动 Agents"
            echo "  --no-auto-install       禁用自动安装依赖"
            echo "  -h, --help              显示帮助"
            exit 0
            ;;
        *) echo "未知参数: $1" >&2; exit 1 ;;
    esac
done

# 获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ==========================================
# 🎨 界面渲染函数
# ==========================================

show_banner() {
    clear 2>/dev/null || true
    echo -e "${CYAN}"
    cat << 'EOF'
                                                                            
    ███████╗████████╗██╗   ██╗██████╗ ██╗   ██╗███████╗ ██████╗ ██╗      ██████╗ 
    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗╚██╗ ██╔╝██╔════╝██╔═══██╗██║     ██╔═══██╗
    ███████╗   ██║   ██║   ██║██║  ██║ ╚████╔╝ ███████╗██║   ██║██║     ██║   ██║
    ╚════██║   ██║   ██║   ██║██║  ██║  ╚██╔╝  ╚════██║██║   ██║██║     ██║   ██║
    ███████║   ██║   ╚██████╔╝██████╔╝   ██║   ███████║╚██████╔╝███████╗╚██████╔╝
    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝ 
                                                                            
EOF
    echo -e "${NC}"
    echo -e "${DARK_GRAY}    [ 宇宙级自动化全栈启动引擎 v1.0 - Linux/macOS ]${NC}"
    echo -e "${DARK_GRAY}    -----------------------------------------------------------------------${NC}"
    echo ""
}

write_info() { echo -e "${CYAN}[ ℹ ] $1${NC}"; }
write_success() { echo -e "${GREEN}[ ✔ ] $1${NC}"; }
write_warning() { echo -e "${YELLOW}[ ⚠ ] $1${NC}"; }
write_error() { echo -e "${RED}[ ✖ ] $1${NC}"; }

show_spinner() {
    local duration=$1
    local message=$2
    local spinner=('|' '/' '-' '\')
    local end_time=$(($(date +%s) + duration))
    local i=0
    while [[ $(date +%s) -lt $end_time ]]; do
        printf "\r${CYAN}[ %s ] %s... ${NC}" "${spinner[$i]}" "$message"
        i=$(( (i + 1) % 4 ))
        sleep 0.1
    done
    printf "\r${GREEN}[ ✔ ] %s... 完成！    ${NC}\n" "$message"
}

# ==========================================
# 🛠️ 核心逻辑函数
# ==========================================

get_env_value() {
    local env_file=$1
    local key=$2
    [[ -f "$env_file" ]] && grep -E "^\s*$key\s*=" "$env_file" 2>/dev/null | head -1 | sed -E "s/^\s*$key\s*=\s*//" | tr -d '"' || echo ""
}

test_and_kill_port() {
    local port=$1
    local service_name=$2
    write_info "正在侦测 $service_name 端口 ($port)..."
    
    local pid=""
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -t -i:$port 2>/dev/null || true)
    elif command -v ss >/dev/null 2>&1; then
        pid=$(ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
    elif command -v netstat >/dev/null 2>&1; then
        pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1 || true)
    fi
    
    if [[ -n "$pid" ]]; then
        write_warning "发现 $service_name 端口 ($port) 正被占用！"
        local process_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
        echo "      -> 准备消灭占用进程: $process_name (PID: $pid)"
        kill -9 "$pid" 2>/dev/null || true
        write_success "已成功解除封印！(终止了 PID: $pid)"
        sleep 1
    else
        write_success "$service_name 端口 ($port) 畅通无阻。"
    fi
}

ensure_venv_and_deps() {
    local service_dir=$1
    local service_name=$2
    local venv_python="$service_dir/.venv/bin/python"
    local requirements_path="$service_dir/requirements.txt"
    
    if [[ ! -f "$venv_python" ]]; then
        write_warning "$service_name 未检测到 .venv，正在自动创建 ..."
        python3 -m venv "$service_dir/.venv"
        if [[ ! -f "$venv_python" ]]; then
            write_error "$service_name 创建虚拟环境失败。"
            return 1
        fi
    fi
    
    [[ "$AUTO_INSTALL_DEPS" == "false" ]] && return 0
    
    if [[ -f "$requirements_path" ]]; then
        "$venv_python" -m pip install --upgrade pip -q
        "$venv_python" -m pip install -r "$requirements_path" -q
        if [[ $? -ne 0 ]]; then
            write_error "$service_name 依赖安装失败。"
            return 1
        fi
    else
        write_warning "$service_name 未找到 requirements.txt，跳过依赖安装。"
    fi
    return 0
}

start_python_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    local command_body=$4
    local required_env_keys=${5:-}
    local blocked_env_values=${6:-"replace-with-a-strong-secret"}
    
    if [[ ! -d "$service_dir" ]]; then
        write_error "找不到 $service_name 目录: $service_dir"
        return 1
    fi
    
    local env_path="$service_dir/.env"
    for key in $required_env_keys; do
        local value=$(get_env_value "$env_path" "$key")
        if [[ -z "$value" ]] || [[ "$value" == "$blocked_env_values" ]]; then
            write_error "$service_name 的 .env 缺少或未正确配置 $key。请先完善: $env_path"
            return 1
        fi
    done
    
    ensure_venv_and_deps "$service_dir" "$service_name" || return 1
    test_and_kill_port "$port" "$service_name"
    
    # 在新终端窗口启动服务
    local cmd="cd '$service_dir' && source .venv/bin/activate && $command_body"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell application \"Terminal\" to do script \"$cmd\"" 2>/dev/null || 
        nohup bash -c "$cmd" > /dev/null 2>&1 &
    else
        if command -v gnome-terminal >/dev/null 2>&1; then
            gnome-terminal -- bash -c "$cmd; exec bash" 2>/dev/null || nohup bash -c "$cmd" > /dev/null 2>&1 &
        elif command -v konsole >/dev/null 2>&1; then
            konsole -e bash -c "$cmd; exec bash" 2>/dev/null || nohup bash -c "$cmd" > /dev/null 2>&1 &
        elif command -v xterm >/dev/null 2>&1; then
            xterm -e bash -c "$cmd; exec bash" 2>/dev/null || nohup bash -c "$cmd" > /dev/null 2>&1 &
        else
            nohup bash -c "$cmd" > /dev/null 2>&1 &
        fi
    fi
    
    write_success "$service_name 启动完成。"
    return 0
}

start_frontend() {
    local frontend_dir="$PROJECT_DIR/frontend"
    if [[ ! -d "$frontend_dir" ]]; then
        write_error "找不到前端目录: $frontend_dir"
        return 1
    fi
    
    write_info "正在构建前端视界 (Next.js)..."
    
    # 清理 .next 缓存
    if [[ -d "$frontend_dir/.next" ]]; then
        write_info "清理 .next 缓存..."
        rm -rf "$frontend_dir/.next"
        write_success ".next 缓存已清理。"
    fi
    
    # 选择包管理器
    local package_manager="npm"
    if command -v pnpm >/dev/null 2>&1; then
        package_manager="pnpm"
    else
        write_warning "未检测到 pnpm，自动降级为 npm。"
    fi
    
    # 检查依赖
    if [[ ! -d "$frontend_dir/node_modules" ]]; then
        write_warning "未检测到前端依赖，请先运行: cd $frontend_dir && $package_manager install"
        return 1
    fi
    
    # 启动前端
    local cmd="cd '$frontend_dir' && $package_manager dev --port $FRONTEND_PORT"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell application \"Terminal\" to do script \"$cmd\"" 2>/dev/null || 
        nohup bash -c "$cmd" > /dev/null 2>&1 &
    else
        if command -v gnome-terminal >/dev/null 2>&1; then
            gnome-terminal -- bash -c "$cmd; exec bash" 2>/dev/null || nohup bash -c "$cmd" > /dev/null 2>&1 &
        elif command -v konsole >/dev/null 2>&1; then
            konsole -e bash -c "$cmd; exec bash" 2>/dev/null || nohup bash -c "$cmd" > /dev/null 2>&1 &
        elif command -v xterm >/dev/null 2>&1; then
            xterm -e bash -c "$cmd; exec bash" 2>/dev/null || nohup bash -c "$cmd" > /dev/null 2>&1 &
        else
            nohup bash -c "$cmd" > /dev/null 2>&1 &
        fi
    fi
    
    write_success "前端视界面板已展开！"
}

start_core_backend() {
    local backend_dir="$PROJECT_DIR/backend"
    write_info "正在注入主后端引擎 (FastAPI)..."
    start_python_service "Main Backend" "$backend_dir" "$BACKEND_PORT" \
        "python -m uvicorn app.main:app --reload --port $BACKEND_PORT --host 0.0.0.0"
}

start_agents() {
    [[ "$START_AGENTS" == "false" ]] && {
        write_warning "已按参数跳过 Agent 组启动。"
        return
    }
    
    echo ""
    echo -e "${MAGENTA}=== 🤖 Agent 启动层 ===${NC}"
    
    local agents_root="$PROJECT_DIR/agents"
    declare -a agents=(
        "Code Review Agent:$agents_root/code-review-agent:8001:python -m src.main:AGENT_API_KEY"
        "Deep Research Agent:$agents_root/deep-research-agent:8002:python -m src.main:AGENT_API_KEY"
        "News Agent:$agents_root/news-agent:8003:python -m src.main:AGENT_API_KEY"
        "Study Tutor Agent:$agents_root/study-tutor-agent:8004:python -m src.main:AGENT_API_KEY"
        "Visual Site Agent:$agents_root/visual-site-agent:8005:python -m src.main:AGENT_API_KEY"
    )
    
    for agent_info in "${agents[@]}"; do
        IFS=':' read -r name dir port cmd <<< "$agent_info"
        write_info "正在启动 $name ..."
        start_python_service "$name" "$dir" "$port" "$cmd" "AGENT_API_KEY" &>/dev/null || true
    done
}

# ==========================================
# 🚀 启动序列
# ==========================================

show_banner

if [[ ! -d "$PROJECT_DIR" ]]; then
    write_error "项目路径不存在: $PROJECT_DIR"
    exit 1
fi

show_spinner 1 "初始化全栈启动协议"

echo ""
echo -e "${MAGENTA}=== 🛡️ 资源接管层 ===${NC}"
test_and_kill_port "$FRONTEND_PORT" "Frontend"
test_and_kill_port "$BACKEND_PORT" "Backend"

show_spinner 1 "正在分配运行内存与通道"

echo ""
echo -e "${MAGENTA}=== ⚙️ 核心启动层 ===${NC}"
start_core_backend
sleep 1
start_frontend
sleep 1
start_agents

echo ""
echo -e "${MAGENTA}=== 🎯 系统已就绪 ===${NC}"
echo -e "${GREEN}  ✨ [ 前端控制台 ] -> http://127.0.0.1:$FRONTEND_PORT${NC}"
echo -e "${GREEN}  ✨ [ 后端 API 根地址 ] -> http://127.0.0.1:$BACKEND_PORT${NC}"
echo -e "${GREEN}  ✨ [ Swagger 接口文档 ] -> http://127.0.0.1:$BACKEND_PORT/docs${NC}"

if [[ "$START_AGENTS" == "true" ]]; then
    echo -e "${GREEN}  ✨ [ Code Review Agent ] -> http://127.0.0.1:8001/health${NC}"
    echo -e "${GREEN}  ✨ [ Deep Research Agent ] -> http://127.0.0.1:8002/health${NC}"
    echo -e "${GREEN}  ✨ [ News Agent ] -> http://127.0.0.1:8003/health${NC}"
    echo -e "${GREEN}  ✨ [ Study Tutor Agent ] -> http://127.0.0.1:8004/health${NC}"
    echo -e "${GREEN}  ✨ [ Visual Site Agent ] -> http://127.0.0.1:8005/health${NC}"
fi

echo ""
echo -e "${YELLOW}祝您开发愉快（代码永无 Bug）！🎉${NC}"
echo ""
read -p "按下回车键退出这艘母舰..."
