from typing import List, Dict
import json
import asyncio
from fastapi import WebSocket, WebSocketDisconnect


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.match_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, match_id: str = None):
        """接受WebSocket连接"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if match_id:
            if match_id not in self.match_connections:
                self.match_connections[match_id] = []
            self.match_connections[match_id].append(websocket)

    def disconnect(self, websocket: WebSocket, match_id: str = None):
        """断开WebSocket连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if match_id and match_id in self.match_connections:
            if websocket in self.match_connections[match_id]:
                self.match_connections[match_id].remove(websocket)
            if not self.match_connections[match_id]:
                del self.match_connections[match_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """发送个人消息"""
        try:
            await websocket.send_text(json.dumps(message))
        except:
            # 连接已断开，移除连接
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """广播消息给所有连接"""
        if self.active_connections:
            await asyncio.gather(
                *[self._safe_send(connection, message) for connection in self.active_connections],
                return_exceptions=True
            )

    async def broadcast_to_match(self, message: dict, match_id: str):
        """广播消息给特定比赛的连接"""
        if match_id in self.match_connections:
            connections = self.match_connections[match_id]
            if connections:
                await asyncio.gather(
                    *[self._safe_send(connection, message) for connection in connections],
                    return_exceptions=True
                )

    async def _safe_send(self, websocket: WebSocket, message: dict):
        """安全发送消息，处理断开连接的情况"""
        try:
            await websocket.send_text(json.dumps(message))
        except:
            # 连接已断开，从列表中移除
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            # 从比赛连接中移除
            for match_id, connections in self.match_connections.items():
                if websocket in connections:
                    connections.remove(websocket)


# 全局WebSocket管理器实例
websocket_manager = WebSocketManager()