#!/usr/bin/env bash

set -u

# StudySolo All-in-One Dev Launcher (Linux/macOS)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUNLOG_DIR="$ROOT_DIR/.runlogs"

BACKEND_PORT="${BACKEND_PORT:-2038}"
FRONTEND_PORT="${FRONTEND_PORT:-2037}"
AUTO_KILL_PORTS="${AUTO_KILL_PORTS:-0}"
PYTHON_BIN="${PYTHON_BIN:-}"
LIVE_LOGS="${LIVE_LOGS:-1}"

BACKEND_ENV_FILE=""
VENV_DIR="$BACKEND_DIR/.venv"
SPAWNED_PIDS=()
LOG_STREAM_PIDS=()
EXITING=0

CLR_RESET="\033[0m"
CLR_CYAN="\033[36m"
CLR_GREEN="\033[32m"
CLR_YELLOW="\033[33m"
CLR_RED="\033[31m"
CLR_MAGENTA="\033[35m"
CLR_GRAY="\033[90m"

print_info() { printf "${CLR_CYAN}[ i ] %s${CLR_RESET}\n" "$1"; }
print_ok() { printf "${CLR_GREEN}[ + ] %s${CLR_RESET}\n" "$1"; }
print_warn() { printf "${CLR_YELLOW}[ ! ] %s${CLR_RESET}\n" "$1"; }
print_err() { printf "${CLR_RED}[ x ] %s${CLR_RESET}\n" "$1"; }

show_banner() {
  clear
  cat <<'EOF'
                                                                            
   ███████╗████████╗██╗   ██╗██████╗ ██╗   ██╗███████╗ ██████╗ ██╗      ██████╗ 
   ██╔════╝╚══██╔══╝██║   ██║██╔══██╗╚██╗ ██╔╝██╔════╝██╔═══██╗██║     ██╔═══██╗
   ███████╗   ██║   ██║   ██║██║  ██║ ╚████╔╝ ███████╗██║   ██║██║     ██║   ██║
   ╚════██║   ██║   ██║   ██║██║  ██║  ╚██╔╝  ╚════██║██║   ██║██║     ██║   ██║
   ███████║   ██║   ╚██████╔╝██████╔╝   ██║   ███████║╚██████╔╝███████╗╚██████╔╝
   ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝ 
                              D E V   L A U N C H E R                           
EOF
  printf "${CLR_GRAY}    [ StudySolo 一键本地启动套件 v2.0 ]${CLR_RESET}\n"
  printf "${CLR_CYAN}    [ Linux/macOS · FastAPI + Next.js ]${CLR_RESET}\n"
  printf "${CLR_GRAY}    -----------------------------------------------------------------------${CLR_RESET}\n\n"
}

show_spinner() {
  local duration="$1"
  local message="$2"
  local chars='|/-\'
  local i=0
  local end_time=$((SECONDS + duration))
  while (( SECONDS < end_time )); do
    printf "\r${CLR_CYAN}[ %c ] %s...${CLR_RESET}" "${chars:i++%4:1}" "$message"
    sleep 0.1
  done
  printf "\r${CLR_GREEN}[ + ] %s... 完成${CLR_RESET}\n" "$message"
}

usage() {
  cat <<EOF
用法:
  ./scripts/start-studysolo.sh [options]

options:
  --backend-port <port>    默认: ${BACKEND_PORT}
  --frontend-port <port>   默认: ${FRONTEND_PORT}
  --python-bin <path|cmd>  指定 Python 解释器（需 >= 3.10）
  --auto-kill-ports        启动前自动清理冲突端口
  --quiet                  不输出实时日志流（仅写入 .runlogs）
  -h, --help               显示帮助
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --backend-port) BACKEND_PORT="$2"; shift 2 ;;
      --frontend-port) FRONTEND_PORT="$2"; shift 2 ;;
      --python-bin) PYTHON_BIN="$2"; shift 2 ;;
      --auto-kill-ports) AUTO_KILL_PORTS="1"; shift ;;
      --quiet) LIVE_LOGS="0"; shift ;;
      -h|--help) usage; exit 0 ;;
      *)
        print_err "未知参数: $1"
        usage
        exit 1
        ;;
    esac
  done
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    print_err "缺少命令: $1"
    exit 1
  fi
}

resolve_python_bin() {
  if [[ -n "$PYTHON_BIN" ]]; then
    command -v "$PYTHON_BIN" >/dev/null 2>&1 || {
      print_err "找不到指定解释器: $PYTHON_BIN"
      exit 1
    }
    return
  fi

  # 1) If a conda env is already activated, prefer it.
  if [[ -n "${CONDA_PREFIX:-}" ]] && [[ -x "${CONDA_PREFIX}/bin/python" ]]; then
    PYTHON_BIN="${CONDA_PREFIX}/bin/python"
    return
  fi

  # 2) Auto-detect common StudySolo conda env locations.
  if [[ -x "$HOME/miniconda3/envs/studysolo/bin/python" ]]; then
    PYTHON_BIN="$HOME/miniconda3/envs/studysolo/bin/python"
    return
  fi
  if [[ -x "$HOME/anaconda3/envs/studysolo/bin/python" ]]; then
    PYTHON_BIN="$HOME/anaconda3/envs/studysolo/bin/python"
    return
  fi
  if [[ -x "$HOME/.conda/envs/studysolo/bin/python" ]]; then
    PYTHON_BIN="$HOME/.conda/envs/studysolo/bin/python"
    return
  fi

  # 3) pyenv common path fallback.
  if [[ -x "$HOME/.pyenv/versions/3.11.11/bin/python" ]]; then
    PYTHON_BIN="$HOME/.pyenv/versions/3.11.11/bin/python"
    return
  fi

  # 4) System interpreters fallback.
  if command -v python3.11 >/dev/null 2>&1; then
    PYTHON_BIN="python3.11"
  elif command -v python3.10 >/dev/null 2>&1; then
    PYTHON_BIN="python3.10"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  else
    print_err "未找到可用 Python，请安装 Python 3.10+（建议 3.11+）"
    exit 1
  fi
}

python_version_ok() {
  local py="$1"
  "$py" - <<'PY'
import sys
sys.exit(0 if sys.version_info >= (3, 10) else 1)
PY
}

ensure_python_version() {
  resolve_python_bin
  if ! python_version_ok "$PYTHON_BIN"; then
    local ver
    ver="$("$PYTHON_BIN" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')"
    print_err "当前解释器版本过低: ${PYTHON_BIN} (${ver})，项目需要 Python >= 3.10"
    exit 1
  fi
}

collect_port_pids() {
  local port="$1"
  local out=""

  if command -v lsof >/dev/null 2>&1; then
    out="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    out="$(fuser "${port}/tcp" 2>/dev/null || true)"
  elif command -v ss >/dev/null 2>&1; then
    out="$(ss -ltnp 2>/dev/null \
      | awk -v p=":$port" '$4 ~ p { if (match($0,/pid=[0-9]+/)) {print substr($0,RSTART+4,RLENGTH-4)} }' \
      || true)"
  fi

  printf "%s\n" "$out" | awk 'NF' | sort -u
}

kill_port_silent() {
  local port="$1"
  local pids
  pids="$(collect_port_pids "$port")"
  [[ -z "$pids" ]] && return

  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    kill -TERM "$pid" 2>/dev/null || true
  done <<< "$pids"
  sleep 0.5
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    kill -KILL "$pid" 2>/dev/null || true
  done <<< "$pids"
}

ensure_port_available() {
  local port="$1"
  local name="$2"
  local pids
  pids="$(collect_port_pids "$port")"
  [[ -z "$pids" ]] && return

  if [[ "$AUTO_KILL_PORTS" == "1" ]]; then
    print_warn "$name 端口($port)被占用，自动清理"
    kill_port_silent "$port"
    pids="$(collect_port_pids "$port")"
    if [[ -n "$pids" ]]; then
      print_err "$name 端口($port)仍被占用: $pids"
      exit 1
    fi
    print_ok "$name 端口($port)已释放"
    return
  fi

  print_err "$name 端口($port)已被占用: $pids"
  print_info "可执行: AUTO_KILL_PORTS=1 ./scripts/start-studysolo.sh"
  exit 1
}

resolve_env_files() {
  if [[ -f "$BACKEND_DIR/.env" ]]; then
    BACKEND_ENV_FILE="$BACKEND_DIR/.env"
  elif [[ -f "$BACKEND_DIR/.env.local" ]]; then
    BACKEND_ENV_FILE="$BACKEND_DIR/.env.local"
  else
    print_err "未找到 backend/.env 或 backend/.env.local，请先执行: cp backend/.env.example backend/.env"
    exit 1
  fi

  if [[ ! -f "$FRONTEND_DIR/.env.local" ]]; then
    print_err "未找到 frontend/.env.local，请先执行: cp frontend/.env.example frontend/.env.local"
    exit 1
  fi
}

ensure_backend_venv() {
  if [[ ! -d "$VENV_DIR" ]]; then
    print_info "创建后端虚拟环境: $VENV_DIR"
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  fi

  if ! "$VENV_DIR/bin/python" - <<'PY'
import sys
sys.exit(0 if sys.version_info >= (3, 10) else 1)
PY
  then
    local venv_ver
    venv_ver="$("$VENV_DIR/bin/python" -c 'import sys; print(".".join(map(str, sys.version_info[:3])))' 2>/dev/null || echo "unknown")"
    print_err "检测到现有虚拟环境版本过低: ${venv_ver}"
    print_info "请执行: rm -rf backend/.venv && PYTHON_BIN=${PYTHON_BIN} ./scripts/start-studysolo.sh"
    exit 1
  fi
}

spawn_service() {
  local name="$1"
  local cmd="$2"
  local log_file="$RUNLOG_DIR/${name}.log"
  : > "$log_file"
  bash -lc "$cmd" >>"$log_file" 2>&1 &
  local pid=$!
  SPAWNED_PIDS+=("$pid")
  print_ok "$name 已启动 (PID=$pid, log=.runlogs/${name}.log)"
}

start_backend() {
  local cmd
  cmd="cd '$BACKEND_DIR' && set -a && source '$BACKEND_ENV_FILE' && set +a && '$VENV_DIR/bin/uvicorn' app.main:app --reload --host 0.0.0.0 --port '$BACKEND_PORT'"
  spawn_service "studysolo-backend" "$cmd"
}

start_frontend() {
  local cmd
  cmd="cd '$FRONTEND_DIR' && pnpm exec next dev --turbopack -p '$FRONTEND_PORT'"
  spawn_service "studysolo-frontend" "$cmd"
}

stream_log_file() {
  local name="$1"
  local logfile="$2"
  (
    tail -n 0 -F "$logfile" 2>/dev/null | while IFS= read -r line; do
      local lc
      lc="$(printf "%s" "$line" | tr '[:upper:]' '[:lower:]')"
      local color="$CLR_GREEN"

      if [[ "$line" == *"⚠"* ]] || [[ "$lc" == *"warn"* ]] || [[ "$lc" == *"warning"* ]]; then
        color="$CLR_YELLOW"
      fi

      if [[ "$lc" == *"error"* ]] || [[ "$lc" == *"exception"* ]] || [[ "$lc" == *"traceback"* ]] || [[ "$lc" == *"failed"* ]] || [[ "$lc" == *"fatal"* ]]; then
        color="$CLR_RED"
      fi

      printf "${color}[%s]${CLR_RESET} %s\n" "$name" "$line"
    done
  ) &
  LOG_STREAM_PIDS+=("$!")
}

start_live_logs() {
  [[ "$LIVE_LOGS" == "1" ]] || return
  local backend_log="$RUNLOG_DIR/studysolo-backend.log"
  local frontend_log="$RUNLOG_DIR/studysolo-frontend.log"
  print_info "实时日志已开启（可看到 GET/200 等请求反馈）"
  stream_log_file "backend" "$backend_log"
  stream_log_file "frontend" "$frontend_log"
}

cleanup_all() {
  [[ "$EXITING" == "1" ]] && return
  EXITING=1

  printf "\n${CLR_MAGENTA}===============================================================${CLR_RESET}\n"
  printf "${CLR_MAGENTA}  正在退出并清理 StudySolo 进程${CLR_RESET}\n"
  printf "${CLR_MAGENTA}===============================================================${CLR_RESET}\n\n"

  for pid in "${SPAWNED_PIDS[@]}"; do
    [[ -z "$pid" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      print_info "结束进程 PID=$pid"
      kill -TERM "$pid" 2>/dev/null || true
    fi
  done

  for pid in "${LOG_STREAM_PIDS[@]}"; do
    [[ -z "$pid" ]] && continue
    kill -TERM "$pid" 2>/dev/null || true
  done

  sleep 0.5
  for pid in "${SPAWNED_PIDS[@]}"; do
    [[ -z "$pid" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL "$pid" 2>/dev/null || true
    fi
  done

  print_info "按端口兜底清理"
  kill_port_silent "$BACKEND_PORT"
  kill_port_silent "$FRONTEND_PORT"

  print_ok "清理完成，无残留进程"
}

main() {
  parse_args "$@"

  require_cmd bash
  require_cmd awk
  require_cmd sort
  require_cmd pnpm

  ensure_python_version
  resolve_env_files

  mkdir -p "$RUNLOG_DIR"

  show_banner
  show_spinner 1 "初始化启动环境"

  echo
  printf "${CLR_MAGENTA}=== Port Check ===${CLR_RESET}\n"
  ensure_port_available "$BACKEND_PORT" "后端"
  ensure_port_available "$FRONTEND_PORT" "前端"
  print_ok "端口检查完成"

  show_spinner 1 "准备运行环境"
  ensure_backend_venv

  print_info "安装后端依赖 (requirements.txt)"
  "$VENV_DIR/bin/pip" install -r "$BACKEND_DIR/requirements.txt" >/dev/null
  print_ok "后端依赖就绪"

  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    print_info "安装前端依赖 (pnpm install)"
    (cd "$FRONTEND_DIR" && pnpm install)
    print_ok "前端依赖就绪"
  fi

  echo
  printf "${CLR_MAGENTA}=== Launch StudySolo ===${CLR_RESET}\n"
  start_backend
  sleep 1
  start_frontend

  echo
  printf "${CLR_MAGENTA}=== Running ===${CLR_RESET}\n"
  printf "${CLR_GREEN}  Frontend: http://localhost:%s${CLR_RESET}\n" "$FRONTEND_PORT"
  printf "${CLR_GREEN}  Backend : http://localhost:%s${CLR_RESET}\n" "$BACKEND_PORT"
  printf "${CLR_GREEN}  Docs    : http://localhost:%s/docs${CLR_RESET}\n" "$BACKEND_PORT"
  printf "${CLR_GRAY}  Logs    : .runlogs/studysolo-backend.log | .runlogs/studysolo-frontend.log${CLR_RESET}\n"
  printf "${CLR_YELLOW}  提示    : 按 Ctrl+C 自动停止并清理全部进程${CLR_RESET}\n\n"

  start_live_logs

  # 自动退出机制：任一关键进程退出，触发全量清理后退出。
  wait -n "${SPAWNED_PIDS[@]}"
}

trap cleanup_all EXIT INT TERM
main "$@"
