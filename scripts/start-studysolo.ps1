<#
.SYNOPSIS
    StudySolo 全栈本地开发启动神器 (Windows)
.DESCRIPTION
    1. 自动检测并解放后端(8000)和前端(5173)端口。
    2. 自动启动后端虚拟环境和 Uvicorn 服务。
    3. 自动启动前端 Vite / pnpm dev 服务。
    4. 采用高级炫酷的控制台动画和 UI 输出。
.NOTES
    作者: AIMFl
.EXAMPLE
    .\start-studysolo.ps1
#>

param (
    [int]$BackendPort = 2038,
    [int]$FrontendPort = 2037
)

# 动态获取当前脚本所在目录的上一级作为项目根目录
$ProjectDir = (Get-Item -Path $PSScriptRoot).Parent.FullName

$ErrorActionPreference = "SilentlyContinue"
$Host.UI.RawUI.WindowTitle = "🚀 StudySolo Dev Launcher"

# ==========================================
# 🎨 界面渲染函数
# ==========================================

function Show-Banner {
    Clear-Host
    $banner = @"
                                                                            
    ███████╗████████╗██╗   ██╗██████╗ ██╗   ██╗███████╗ ██████╗ ██╗      ██████╗ 
    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗╚██╗ ██╔╝██╔════╝██╔═══██╗██║     ██╔═══██╗
    ███████╗   ██║   ██║   ██║██║  ██║ ╚████╔╝ ███████╗██║   ██║██║     ██║   ██║
    ╚════██║   ██║   ██║   ██║██║  ██║  ╚██╔╝  ╚════██║██║   ██║██║     ██║   ██║
    ███████║   ██║   ╚██████╔╝██████╔╝   ██║   ███████║╚██████╔╝███████╗╚██████╔╝
    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝ 
                                                                            
"@
    Write-Host $banner -ForegroundColor Cyan
    Write-Host "    [ 宇宙级自动化全栈启动引擎 v1.0 ]" -ForegroundColor DarkGray
    Write-Host "    -----------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Info($Text) {
    Write-Host "[ ℹ ] $Text" -ForegroundColor Cyan
}

function Write-Success($Text) {
    Write-Host "[ ✔ ] $Text" -ForegroundColor Green
}

function Write-Warning($Text) {
    Write-Host "[ ⚠ ] $Text" -ForegroundColor Yellow
}

function Write-ErrorMsg($Text) {
    Write-Host "[ ✖ ] $Text" -ForegroundColor Red
}

function Show-Spinner($Duration, $Message) {
    $spinner = @('|', '/', '-', '\')
    $counter = 0
    $endTime = (Get-Date).AddSeconds($Duration)
    while ((Get-Date) -lt $endTime) {
        $char = $spinner[$counter % 4]
        Write-Host "`r[ $char ] $Message... " -NoNewline -ForegroundColor Cyan
        Start-Sleep -Milliseconds 100
        $counter++
    }
    Write-Host "`r[ ✔ ] $Message... 完成！    " -ForegroundColor Green
}

# ==========================================
# 🛠️ 核心逻辑函数
# ==========================================

function Test-And-KillPort([int]$Port, [string]$ServiceName) {
    Write-Info "正在侦测 $ServiceName 端口 ($Port)..."
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    
    if ($connections) {
        Write-Warning "发现 $ServiceName 端口 ($Port) 正被占用！"
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill) {
                $process = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "      -> 准备消灭占用进程: $($process.ProcessName) (PID: $pidToKill)" -ForegroundColor DarkGray
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    Write-Success "已成功解除封印！(终止了 PID: $pidToKill)"
                }
            }
        }
        Start-Sleep -Seconds 1
    }
    else {
        Write-Success "$ServiceName 端口 ($Port) 畅通无阻。"
    }
}

function Start-Backend {
    $backendDir = Join-Path $ProjectDir "backend"
    if (-not (Test-Path $backendDir)) {
        Write-ErrorMsg "找不到后端目录: $backendDir"
        return
    }
    Write-Info "正在注入后端引擎 (FastAPI)..."
    
    $venvPath = Join-Path $backendDir ".venv"
    
    # 如果虚拟环境不存在，先创建并安装依赖
    if (-not (Test-Path $venvPath)) {
        Write-Warning "未检测到虚拟环境，正在自动创建 .venv ..."
        $setupCmd = "cd '$backendDir'; "
        $setupCmd += "python -m venv .venv; "
        $setupCmd += ".\.venv\Scripts\Activate.ps1; "
        $setupCmd += "python -m pip install --upgrade pip; "
        $setupCmd += "pip install -r requirements.txt; "
        $setupCmd += "Write-Host ''; "
        $setupCmd += "Write-Host '==============================' -ForegroundColor Green; "
        $setupCmd += "Write-Host '  虚拟环境创建完成！依赖已安装！' -ForegroundColor Green; "
        $setupCmd += "Write-Host '  请重新运行 start-studysolo.ps1 启动服务' -ForegroundColor Yellow; "
        $setupCmd += "Write-Host '==============================' -ForegroundColor Green; "
        $setupCmd += "Read-Host '按回车键关闭此窗口'"
        Start-Process powershell -ArgumentList "-NoExit -Command `"$setupCmd`"" -WindowStyle Normal
        Write-Warning "后端虚拟环境正在创建中，请等待完成后重新运行本脚本！"
        return
    }
    
    # 构建启动命令
    $cmd = "cd '$backendDir'; "
    $cmd += ".\.venv\Scripts\Activate.ps1; "
    $cmd += "uvicorn app.main:app --reload --port $BackendPort --host 0.0.0.0"
    
    # 启动新窗口执行
    Start-Process powershell -ArgumentList "-NoExit -Command `"$cmd`"" -WindowStyle Normal
    Write-Success "后端引擎点火成功！"
}

function Start-Frontend {
    $frontendDir = Join-Path $ProjectDir "frontend"
    if (-not (Test-Path $frontendDir)) {
        Write-ErrorMsg "找不到前端目录: $frontendDir"
        return
    }
    Write-Info "正在构建前端视界 (Next.js)..."
    
    # 启动新窗口执行
    $cmd = "cd '$frontendDir'; pnpm dev"
    Start-Process powershell -ArgumentList "-NoExit -Command `"$cmd`"" -WindowStyle Normal
    Write-Success "前端视界面板已展开！"
}

# ==========================================
# 🚀 启动序列
# ==========================================

Show-Banner

if (-not (Test-Path $ProjectDir)) {
    Write-ErrorMsg "项目路径不存在: $ProjectDir"
    Write-Host "路径错误，无法启动！"
    Pause
    exit
}

Show-Spinner 1 "初始化全栈启动协议"

# 1. 端口检查与释放
Write-Host ""
Write-Host "=== 🛡️ 资源接管层 ===" -ForegroundColor Magenta
Test-And-KillPort $BackendPort "Backend"
Test-And-KillPort $FrontendPort "Frontend"

Show-Spinner 1 "正在分配运行内存与通道"

# 2. 启动服务
Write-Host ""
Write-Host "=== ⚙️ 核心启动层 ===" -ForegroundColor Magenta
Start-Backend
Start-Sleep -Seconds 1
Start-Frontend

# 3. 完成结算
Write-Host ""
Write-Host "=== 🎯 系统已就绪 ===" -ForegroundColor Magenta
Write-Host "  ✨ [ 前端控制台 ] -> http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "  ✨ [ 后端 API 根地址 ] -> http://localhost:$BackendPort" -ForegroundColor Green
Write-Host "  ✨ [ Swagger 接口文档 ] -> http://localhost:$BackendPort/docs" -ForegroundColor Green
Write-Host ""
Write-Host "祝您开发愉快（代码永无 Bug）！🎉" -ForegroundColor Yellow
Write-Host ""
Read-Host "按下回车键退出这艘母舰..."

