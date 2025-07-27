"""
CC Live 游戏API主应用程序
提供游戏事件、分数更新和全局状态管理的API服务
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import game_routes
import global_routes

# 创建FastAPI应用实例
app = FastAPI(
    title="CC Live 游戏API",
    description="用于游戏事件、分数更新和全局状态管理的API服务",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI文档地址
    redoc_url="/redoc"  # ReDoc文档地址
)

# 添加CORS中间件以支持跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应限制具体域名
    allow_credentials=True,  # 允许携带凭证
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有请求头
)

# 首先包含全局相关的路由（更具体的路径）
app.include_router(global_routes.router, tags=["全局事件"])

# 然后包含游戏相关的路由（更通用的路径模式）
app.include_router(game_routes.router, tags=["游戏事件"])


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
        "main:app",      # 使用模块导入字符串格式
        host="0.0.0.0",  # 监听所有网络接口
        port=8000,       # 监听端口
        reload=True      # 开发模式，文件改动时自动重载
    )