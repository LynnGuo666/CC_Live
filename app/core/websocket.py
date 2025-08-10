"""
WebSocket连接管理器
管理客户端连接和消息广播
"""

import json
import asyncio
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime


class ConnectionManager:
    def __init__(self):
        # 存储活跃的WebSocket连接
        self.active_connections: Set[WebSocket] = set()
        # 存储连接的客户端信息
        self.client_info: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str = None):
        """接受新的WebSocket连接"""
        await websocket.accept()
        self.active_connections.add(websocket)
        self.client_info[websocket] = {
            "client_id": client_id or f"client_{len(self.active_connections)}",
            "connected_at": datetime.now().isoformat(),
            "last_ping": datetime.now().isoformat(),
            # 可选：观赛ID（由客户端提交后填充）
            "viewer_id": None,
        }
        print(f"客户端连接: {self.client_info[websocket]['client_id']}, 当前连接数: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """断开WebSocket连接"""
        if websocket in self.active_connections:
            client_id = self.client_info.get(websocket, {}).get("client_id", "unknown")
            self.active_connections.remove(websocket)
            if websocket in self.client_info:
                del self.client_info[websocket]
            print(f"客户端断开: {client_id}, 当前连接数: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """发送消息给特定客户端"""
        try:
            await websocket.send_text(json.dumps(message, ensure_ascii=False))
        except Exception as e:
            print(f"发送个人消息失败: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        """广播消息给所有连接的客户端"""
        if not self.active_connections:
            print("没有活跃连接，跳过广播")
            return
        
        message_str = json.dumps(message, ensure_ascii=False)
        print(f"广播消息给 {len(self.active_connections)} 个客户端: {message.get('type', 'unknown')}")
        
        # 使用副本避免在循环中修改集合
        connections_copy = self.active_connections.copy()
        
        # 并发发送消息给所有客户端
        tasks = []
        for connection in connections_copy:
            tasks.append(self._send_safe(connection, message_str))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _send_safe(self, websocket: WebSocket, message: str):
        """安全发送消息，处理连接异常"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"发送消息失败，移除连接: {e}")
            self.disconnect(websocket)
    
    def get_connection_count(self) -> int:
        """获取当前连接数"""
        return len(self.active_connections)
    
    def get_client_list(self) -> List[dict]:
        """获取所有客户端信息"""
        return [
            {
                "client_id": info["client_id"],
                "connected_at": info["connected_at"],
                "last_ping": info["last_ping"],
                # 将 viewer_id 暴露给统计接口
                "viewer_id": info.get("viewer_id")
            }
            for info in self.client_info.values()
        ]


# 全局连接管理器实例
connection_manager = ConnectionManager()