"""
应用程序配置和初始化模块
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    """
    创建并配置FastAPI应用实例
    """
    app = FastAPI(
        title="CC Live 游戏API",
        description="用于游戏事件、分数更新和全局状态管理的API服务",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # 添加CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app