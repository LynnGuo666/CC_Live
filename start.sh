#!/bin/bash

# Minecraft锦标赛直播服务器启动脚本

echo "正在启动Minecraft锦标赛直播服务器..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 检查Node.js环境（如果需要启动前端）
if ! command -v node &> /dev/null; then
    echo "警告: 未找到Node.js，前端将不会启动"
    FRONTEND_AVAILABLE=false
else
    FRONTEND_AVAILABLE=true
fi

# 安装Python依赖
echo "正在安装Python依赖..."
pip3 install -r requirements.txt

# 启动Python后端服务器
echo "正在启动Python后端服务器 (端口8000)..."
python3 main.py &
BACKEND_PID=$!

echo "后端服务器已启动，PID: $BACKEND_PID"

# 如果前端可用，启动前端服务器
if [ "$FRONTEND_AVAILABLE" = true ] && [ -d "frontend" ]; then
    echo "正在启动Next.js前端服务器 (端口3000)..."
    cd frontend
    npm install
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo "前端服务器已启动，PID: $FRONTEND_PID"
fi

echo ""
echo "=========================================="
echo "   Minecraft锦标赛直播服务器已启动"
echo "=========================================="
echo "后端API服务器: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo "WebSocket连接: ws://localhost:8000/ws/live"

if [ "$FRONTEND_AVAILABLE" = true ] && [ -d "frontend" ]; then
    echo "前端界面: http://localhost:3000"
fi

echo ""
echo "API端点说明："
echo "  POST /api/{game_id}/event     - 推送游戏事件"
echo "  POST /api/{game_id}/score     - 更新游戏分数"
echo "  POST /api/game/score         - 更新全局分数"
echo "  POST /api/game/event         - 推送全局事件"
echo "  POST /api/vote/event         - 推送投票事件"
echo "  GET  /api/tournament         - 获取锦标赛信息"
echo "  GET  /api/leaderboard        - 获取积分榜"
echo ""
echo "按 Ctrl+C 停止服务器"

# 等待用户中断
wait