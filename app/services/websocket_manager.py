from typing import List, Dict
from fastapi import WebSocket
import json
import asyncio

class WebSocketManager:
    """
    WebSocket连接管理器
    负责管理所有WebSocket连接，实现实时消息广播功能
    支持游戏事件、分数更新、投票数据等多种消息类型的广播
    """
    def __init__(self):
        """初始化WebSocket管理器"""
        self.active_connections: List[WebSocket] = []  # 活跃的WebSocket连接列表
        self.connection_count = 0  # 当前连接数量

    async def connect(self, websocket: WebSocket):
        """
        接受新的WebSocket连接
        
        Args:
            websocket: WebSocket连接实例
        """
        # 注意：不要在这里调用accept()，因为在websocket端点中已经调用过了
        self.active_connections.append(websocket)  # 添加到活跃连接列表
        self.connection_count += 1  # 增加连接计数
        await self.broadcast_viewer_count()  # 广播新的观看人数

    def disconnect(self, websocket: WebSocket):
        """
        断开WebSocket连接
        
        Args:
            websocket: 要断开的WebSocket连接实例
        """
        self.active_connections.remove(websocket)  # 从活跃连接列表移除
        self.connection_count -= 1  # 减少连接计数
        asyncio.create_task(self.broadcast_viewer_count())  # 异步广播新的观看人数

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        向指定WebSocket连接发送个人消息
        
        Args:
            message: 要发送的消息内容
            websocket: 目标WebSocket连接
        """
        await websocket.send_text(message)

    async def broadcast(self, message: Dict):
        """
        向所有活跃连接广播消息
        自动处理断开的连接，确保消息传递的可靠性
        
        Args:
            message: 要广播的消息字典
        """
        if self.active_connections:
            # 将消息字典转换为JSON字符串，支持中文字符
            message_str = json.dumps(message, ensure_ascii=False, default=str)
            disconnected = []  # 记录断开的连接
            
            # 遍历所有活跃连接发送消息
            for connection in self.active_connections:
                try:
                    await connection.send_text(message_str)
                except:
                    # 发送失败，标记为断开连接
                    disconnected.append(connection)
            
            # 清理断开的连接
            for connection in disconnected:
                if connection in self.active_connections:
                    self.active_connections.remove(connection)
                    self.connection_count -= 1

    async def broadcast_viewer_count(self):
        """
        广播当前观看人数
        当有新用户连接或断开时调用
        """
        await self.broadcast({
            "type": "viewer_count",
            "count": self.connection_count
        })

    async def broadcast_game_event(self, game_id: str, event_data: Dict):
        """
        广播游戏事件
        包含玩家击杀、物品获取、游戏状态变更等事件
        
        Args:
            game_id: 游戏标识符
            event_data: 事件数据（玩家、队伍、事件类型、分数预测等）
        """
        await self.broadcast({
            "type": "game_event",
            "game_id": game_id,
            "data": event_data
        })

    async def broadcast_score_update(self, data: Dict):
        """
        广播分数更新
        包含加权分数、积分对比、排行榜变化等信息
        
        Args:
            data: 分数数据（原始分数、加权分数、轮次权重等）
        """
        await self.broadcast({
            "type": "score_update",
            "data": data
        })

    async def broadcast_global_event(self, data: Dict):
        """
        广播全局事件
        包含游戏状态变更、轮次切换、锦标赛进度等信息
        
        Args:
            data: 全局事件数据（状态、当前游戏、轮次权重等）
        """
        await self.broadcast({
            "type": "global_event",
            "data": data
        })

    async def broadcast_vote_event(self, data: Dict):
        """
        广播投票事件
        包含投票结果、票数变化等信息（只读展示用）
        
        Args:
            data: 投票数据（游戏名称、票数、投票状态等）
        """
        await self.broadcast({
            "type": "vote_event",
            "data": data
        })

# 全局WebSocket管理器实例
# 在整个应用中共享使用，确保所有连接的统一管理
manager = WebSocketManager()