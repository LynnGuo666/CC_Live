"""
CC Live 游戏API主应用程序
提供游戏事件、分数更新和全局状态管理的API服务
"""

from app.core.config import create_app
from app.api import global_routes, game_routes, websocket_routes
from app.core.data_manager import data_manager
import asyncio
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import Message

# 加载 .env（Docker 可挂载 .env 文件）
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

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


# ========== 调试：捕获请求体并在 405 时输出 ==========
async def _set_body(request: Request, body: bytes) -> None:
    async def receive() -> Message:
        return {"type": "http.request", "body": body, "more_body": False}
    request._receive = receive  # type: ignore[attr-defined]


@app.middleware("http")
async def capture_request_body(request: Request, call_next):
    try:
        body = await request.body()
        # 重新注入 body，避免下游读取不到
        await _set_body(request, body)
        request.state._raw_body = body
    except Exception:
        request.state._raw_body = b""
    response = await call_next(request)
    # 如果是 405，打印一份调试信息
    if getattr(response, "status_code", None) in (400, 401, 403, 404, 405, 415, 422):
        try:
            snippet = (request.state._raw_body or b"")[:2048]
            print(f"[{response.status_code}][DEBUG] method=", request.method, "path=", str(request.url))
            print(f"[{response.status_code}][DEBUG] headers=", {k.lower(): v for k, v in request.headers.items() if k.lower() in ("content-type", "content-length", "authorization")})
            print(f"[{response.status_code}][DEBUG] body=", snippet.decode(errors="ignore"))
        except Exception:
            pass
    return response


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code in (400, 401, 403, 404, 405, 415, 422):
        # 返回更详细的 JSON，便于前端或调用方直接看到原因
        try:
            raw = getattr(request.state, "_raw_body", b"")
            snippet = raw[:2048].decode(errors="ignore")
        except Exception:
            snippet = ""
        allow = None
        try:
            allow = exc.headers.get("allow") if getattr(exc, "headers", None) else None
        except Exception:
            allow = None
        payload = {
            "error": "Method Not Allowed",
            "status": exc.status_code,
            "method": request.method,
            "path": str(request.url),
            "allow": allow,
            "headers": {k.lower(): v for k, v in request.headers.items() if k.lower() in ("content-type", "content-length", "authorization")},
            "body_snippet": snippet,
        }
        return JSONResponse(payload, status_code=exc.status_code)
    # 其他保持默认
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


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