"""
CC Live 游戏API主应用程序
提供游戏事件、分数更新和全局状态管理的API服务
"""

from app.core.config import create_app
from app.api import global_routes, game_routes, websocket_routes
from app.core.data_manager import data_manager
import asyncio

# 创建应用实例
app = create_app()

# 注册路由
app.include_router(websocket_routes.router, tags=["WebSocket"])
app.include_router(global_routes.router, tags=["全局事件"])
app.include_router(game_routes.router, tags=["游戏事件"])


@app.on_event("startup")
async def startup_event():
    """应用启动时的初始化"""
    print("CC Live 游戏API服务启动中...")
    print("数据管理器已初始化，支持定时广播机制")


@app.get("/")
async def root():
    """
    根路径端点
    返回API服务的基本信息
    """
    return {
        "message": "CC Live 游戏API服务正在运行",
        "version": "1.0.0",
        "status": "运行中",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """
    健康检查端点
    用于监控服务状态
    """
    return {
        "status": "健康",
        "service": "CC Live 游戏API",
        "version": "1.0.0"
    }


# 应用程序启动入口
if __name__ == "__main__":
    import uvicorn
    print("正在启动 CC Live 游戏API服务...")
    print("访问 http://localhost:8000/docs 查看API文档")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )