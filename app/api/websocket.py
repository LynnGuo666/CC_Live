from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import manager

router = APIRouter()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点 - 提供实时数据"""
    await websocket.accept()
    
    # 连接时初始化数据
    await manager.initialize_from_database()
    await manager.connect(websocket)
    
    try:
        while True:
            # 保持连接活跃，可以接收来自客户端的消息
            data = await websocket.receive_text()
            # 这里可以处理客户端发送的消息，比如投票等
    except WebSocketDisconnect:
        manager.disconnect(websocket)