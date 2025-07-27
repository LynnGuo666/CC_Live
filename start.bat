@echo off
REM MC小游戏比赛在线直播系统 - Windows自动启动脚本
REM 作者: Claude Code
REM 版本: 1.0.0

setlocal enabledelayedexpansion

REM 颜色定义（Windows 10+）
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "CYAN=[96m"
set "NC=[0m"

REM 显示横幅
echo.
echo %PURPLE%╔══════════════════════════════════════════════════════════════╗%NC%
echo %PURPLE%║                                                              ║%NC%
echo %PURPLE%║        🎮 MC小游戏比赛在线直播系统 🎮                        ║%NC%
echo %PURPLE%║                                                              ║%NC%
echo %PURPLE%║     FastAPI + Next.js + SQLite + WebSocket                  ║%NC%
echo %PURPLE%║                                                              ║%NC%
echo %PURPLE%║     作者: Claude Code                                        ║%NC%
echo %PURPLE%║     版本: 1.0.0                                              ║%NC%
echo %PURPLE%║                                                              ║%NC%
echo %PURPLE%╚══════════════════════════════════════════════════════════════╝%NC%
echo.

REM 检查是否在项目根目录
if not exist "main.py" (
    echo %RED%[错误]%NC% 请在项目根目录执行此脚本
    pause
    exit /b 1
)

REM 检查Python
echo %BLUE%[步骤]%NC% 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[错误]%NC% Python未安装，请先安装Python 3.8+
    pause
    exit /b 1
)
echo %GREEN%[成功]%NC% Python已安装

REM 检查Node.js
echo %BLUE%[步骤]%NC% 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[错误]%NC% Node.js未安装，请先安装Node.js 18+
    pause
    exit /b 1
)
echo %GREEN%[成功]%NC% Node.js已安装

REM 初始化环境配置
echo %BLUE%[步骤]%NC% 初始化环境配置...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo %GREEN%[成功]%NC% 已创建 .env 配置文件
    ) else (
        echo # SQLite数据库文件名 > .env
        echo DATABASE_FILE=mc_live.db >> .env
        echo. >> .env
        echo # 调试模式 >> .env
        echo DEBUG=True >> .env
        echo. >> .env
        echo # 服务器配置 >> .env
        echo HOST=0.0.0.0 >> .env
        echo PORT=8000 >> .env
        echo %GREEN%[成功]%NC% 已创建默认 .env 配置文件
    )
) else (
    echo %CYAN%[信息]%NC% .env 配置文件已存在
)

REM 解析命令行参数
set SKIP_DEPS=false
set SKIP_BUILD=false
set DEV_MODE=false

:parse_args
if "%~1"=="--skip-deps" (
    set SKIP_DEPS=true
    shift
    goto parse_args
)
if "%~1"=="--skip-build" (
    set SKIP_BUILD=true
    shift
    goto parse_args
)
if "%~1"=="--dev" (
    set DEV_MODE=true
    shift
    goto parse_args
)
if "%~1"=="--help" goto help
if "%~1"=="-h" goto help
if not "%~1"=="" (
    echo %YELLOW%[警告]%NC% 未知参数: %~1
    shift
    goto parse_args
)

REM 安装依赖
if "%SKIP_DEPS%"=="false" (
    echo %BLUE%[步骤]%NC% 安装Python依赖...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo %RED%[错误]%NC% Python依赖安装失败
        pause
        exit /b 1
    )
    echo %GREEN%[成功]%NC% Python依赖安装完成

    echo %BLUE%[步骤]%NC% 安装前端依赖...
    cd frontend
    npm install
    if errorlevel 1 (
        echo %RED%[错误]%NC% 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo %GREEN%[成功]%NC% 前端依赖安装完成
    cd ..
) else (
    echo %CYAN%[信息]%NC% 跳过依赖安装
)

REM 构建前端
if "%DEV_MODE%"=="true" (
    echo %CYAN%[信息]%NC% 开发模式：跳过前端构建
) else if "%SKIP_BUILD%"=="false" (
    echo %BLUE%[步骤]%NC% 构建前端应用...
    cd frontend
    npm run build
    if errorlevel 1 (
        echo %RED%[错误]%NC% 前端构建失败
        cd ..
        pause
        exit /b 1
    )
    echo %GREEN%[成功]%NC% 前端构建完成
    cd ..
) else (
    echo %CYAN%[信息]%NC% 跳过前端构建
)

REM 启动应用
echo %BLUE%[步骤]%NC% 启动应用服务...
echo.
echo %CYAN%[信息]%NC% 正在启动服务器...
echo %CYAN%[信息]%NC% 访问地址: http://localhost:8000
echo %CYAN%[信息]%NC% API文档: http://localhost:8000/api/docs
echo.
echo %CYAN%[信息]%NC% 按 Ctrl+C 停止服务
echo.

python main.py
goto end

:help
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   --skip-deps    跳过依赖安装
echo   --skip-build   跳过前端构建
echo   --dev          开发模式（跳过构建）
echo   --help, -h     显示帮助信息
echo.
pause
exit /b 0

:end
echo.
echo %CYAN%[信息]%NC% 服务已停止
pause