"""
WebSocket路由模块
处理WebSocket连接和实时消息推送
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket import connection_manager
import asyncio
import json

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, client_id: str = Query(None)):
    """
    WebSocket连接端点
    客户端通过此端点建立长连接接收实时数据
    """
    await connection_manager.connect(websocket, client_id)
    
    try:
        # 发送连接成功消息
        await connection_manager.send_personal_message({
            "type": "connection",
            "status": "connected",
            "message": "连接成功",
            "client_id": connection_manager.client_info[websocket]["client_id"],
            "timestamp": connection_manager.client_info[websocket]["connected_at"]
        }, websocket)
        
        # 保持连接活跃，监听客户端消息
        while True:
            try:
                # 等待客户端消息（心跳包等）
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # 处理心跳包
                if message.get("type") == "ping":
                    await connection_manager.send_personal_message({
                        "type": "pong",
                        "timestamp": connection_manager.client_info[websocket]["connected_at"]
                    }, websocket)
                
                # 处理客户端请求连接状态
                elif message.get("type") == "status":
                    await connection_manager.send_personal_message({
                        "type": "status_response",
                        "connection_count": connection_manager.get_connection_count(),
                        "client_info": connection_manager.client_info[websocket]
                    }, websocket)
                    
            except asyncio.TimeoutError:
                # 可以添加超时处理
                continue
                
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket错误: {e}")
        connection_manager.disconnect(websocket)


@router.get("/ws/stats")
async def get_websocket_stats():
    """
    获取WebSocket连接统计信息
    """
    return {
        "connection_count": connection_manager.get_connection_count(),
        "clients": connection_manager.get_client_list()
    }