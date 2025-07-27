from typing import List, Dict
from fastapi import WebSocket
import json
import asyncio

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_count = 0

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_count += 1
        await self.broadcast_viewer_count()

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        self.connection_count -= 1
        asyncio.create_task(self.broadcast_viewer_count())

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: Dict):
        if self.active_connections:
            message_str = json.dumps(message, ensure_ascii=False, default=str)
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(message_str)
                except:
                    disconnected.append(connection)
            
            for connection in disconnected:
                if connection in self.active_connections:
                    self.active_connections.remove(connection)
                    self.connection_count -= 1

    async def broadcast_viewer_count(self):
        await self.broadcast({
            "type": "viewer_count",
            "count": self.connection_count
        })

    async def broadcast_game_event(self, game_id: str, event_data: Dict):
        await self.broadcast({
            "type": "game_event",
            "game_id": game_id,
            "data": event_data
        })

    async def broadcast_score_update(self, data: Dict):
        await self.broadcast({
            "type": "score_update",
            "data": data
        })

    async def broadcast_global_event(self, data: Dict):
        await self.broadcast({
            "type": "global_event",
            "data": data
        })

    async def broadcast_vote_event(self, data: Dict):
        await self.broadcast({
            "type": "vote_event",
            "data": data
        })

manager = WebSocketManager()