@echo off
chcp 65001

REM Minecraft锦标赛直播服务器启动脚本 (Windows版本)

echo 正在启动Minecraft锦标赛直播服务器...

REM 检查Python环境
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到Python，请先安装Python
    pause
    exit /b 1
)

REM 检查Node.js环境
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 警告: 未找到Node.js，前端将不会启动
    set FRONTEND_AVAILABLE=false
) else (
    set FRONTEND_AVAILABLE=true
)

REM 安装Python依赖
echo 正在安装Python依赖...
pip install -r requirements.txt

REM 启动Python后端服务器
echo 正在启动Python后端服务器 (端口8000)...
start "Backend Server" python main.py

echo 后端服务器已启动

REM 如果前端可用，启动前端服务器
if "%FRONTEND_AVAILABLE%"=="true" (
    if exist "frontend" (
        echo 正在启动Next.js前端服务器 (端口3000)...
        cd frontend
        start "Frontend Server" cmd /c "npm install && npm run dev"
        cd ..
        echo 前端服务器已启动
    )
)

echo.
echo ==========================================
echo    Minecraft锦标赛直播服务器已启动
echo ==========================================
echo 后端API服务器: http://localhost:8000
echo API文档: http://localhost:8000/docs
echo WebSocket连接: ws://localhost:8000/ws/live

if "%FRONTEND_AVAILABLE%"=="true" (
    if exist "frontend" (
        echo 前端界面: http://localhost:3000
    )
)

echo.
echo API端点说明：
echo   POST /api/{game_id}/event     - 推送游戏事件
echo   POST /api/{game_id}/score     - 更新游戏分数
echo   POST /api/game/score         - 更新全局分数
echo   POST /api/game/event         - 推送全局事件
echo   POST /api/vote/event         - 推送投票事件
echo   GET  /api/tournament         - 获取锦标赛信息
echo   GET  /api/leaderboard        - 获取积分榜
echo.
echo 按任意键退出...
pause