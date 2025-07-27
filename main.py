"""
MC小游戏比赛在线直播系统 - 主启动文件

功能:
- 启动FastAPI应用
- 集成NextJS前端静态文件
- 配置API路由和WebSocket
- 初始化数据库连接

作者: Claude Code
版本: 1.0.0
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from app.core.database import init_db
from app.api import game, matches, websocket, tournament


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时初始化数据库表结构
    """
    print("🚀 正在启动MC小游戏直播系统...")
    # 使用新的锦标赛模型初始化数据库
    await init_db(use_tournament_models=True)
    print("✅ 数据库初始化完成")
    yield
    print("🛑 应用正在关闭...")


# 创建FastAPI应用实例
app = FastAPI(
    title="MC小游戏比赛直播系统",
    description="接收游戏数据并提供实时直播功能",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",  # Swagger文档地址
    redoc_url="/api/redoc"  # ReDoc文档地址
)

# 注册API路由模块
app.include_router(game.router, prefix="/api/game", tags=["游戏数据接收"])
app.include_router(matches.router, prefix="/api/matches", tags=["比赛数据查询"])
app.include_router(tournament.router, prefix="/api/tournament", tags=["锦标赛管理"])
app.include_router(websocket.router, prefix="/ws", tags=["实时通信"])

# 挂载NextJS构建后的静态文件
# 支持前后端一体化部署
if os.path.exists("frontend/out"):
    print("✅ 检测到前端构建文件，启用静态文件服务")
    
    # 挂载Next.js静态资源
    if os.path.exists("frontend/out/_next"):
        app.mount("/_next", StaticFiles(directory="frontend/out/_next"), name="nextjs_static")
        print("✅ 挂载Next.js静态资源")
    
    # 挂载前端页面，使用catch-all来支持SPA路由
    app.mount("/", StaticFiles(directory="frontend/out", html=True), name="frontend")
    print("✅ 挂载前端应用")
        
else:
    print("⚠️  未检测到前端构建文件")
    
    @app.get("/")
    async def read_index():
        """未构建前端时的提示页面"""
        return {
            "message": "前端文件未构建，请先运行 npm run build",
            "api_docs": "/api/docs",
            "websocket_health": "/ws/health"
        }


if __name__ == "__main__":
    import uvicorn
    print("🌐 启动服务器: http://localhost:8000")
    print("📖 API文档: http://localhost:8000/api/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)