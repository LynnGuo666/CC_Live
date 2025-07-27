from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.tournament_models import Comment
from app.schemas.schemas import CommentCreate
from app.services.websocket_manager import websocket_manager
import json

router = APIRouter()


@router.websocket("/live/{match_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    match_id: str,
    db: AsyncSession = Depends(get_db)
):
    """WebSocket连接端点"""
    await websocket_manager.connect(websocket, match_id)
    
    try:
        # 发送连接成功消息
        await websocket_manager.send_personal_message({
            "type": "connection_established",
            "match_id": match_id,
            "message": f"已连接到比赛 {match_id} 的直播"
        }, websocket)
        
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 处理不同类型的消息
            if message_data.get("type") == "comment":
                await handle_comment(message_data, match_id, db)
            elif message_data.get("type") == "ping":
                await websocket_manager.send_personal_message({
                    "type": "pong",
                    "timestamp": message_data.get("timestamp")
                }, websocket)
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, match_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket, match_id)


async def handle_comment(message_data: dict, match_id: str, db: AsyncSession):
    """处理用户评论"""
    try:
        username = message_data.get("username", "匿名用户")
        content = message_data.get("content", "")
        
        if not content.strip():
            return
        
        # 保存评论到数据库
        comment = Comment(
            match_id=match_id,
            username=username,
            content=content
        )
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        
        # 广播评论给所有观看此比赛的用户
        await websocket_manager.broadcast_to_match({
            "type": "new_comment",
            "match_id": match_id,
            "comment": {
                "id": comment.id,
                "username": username,
                "content": content,
                "timestamp": comment.timestamp.isoformat()
            }
        }, match_id)
        
    except Exception as e:
        print(f"Error handling comment: {e}")


@router.get("/health")
async def websocket_health():
    """WebSocket服务健康检查"""
    return {
        "status": "healthy",
        "active_connections": len(websocket_manager.active_connections),
        "match_connections": len(websocket_manager.match_connections)
    }