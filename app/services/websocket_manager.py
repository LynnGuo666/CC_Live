from typing import List, Dict, Optional
from fastapi import WebSocket
import json
import asyncio

class WebSocketManager:
    """
    WebSocket连接管理器
    负责管理所有WebSocket连接，统一发送完整的比赛数据
    所有数据通过单一的WebSocket端点传递，不使用REST API
    """
    def __init__(self):
        """初始化WebSocket管理器"""
        self.active_connections: List[WebSocket] = []
        self.connection_count = 0
        
        # 存储完整的比赛状态数据
        self.tournament_data = {
            "tournament": {
                "id": 1,
                "name": "S2CC锦标赛", 
                "status": "setting",
                "current_game": "",
                "current_round": 1
            },
            "leaderboard": {
                "teams": [],
                "players": []
            },
            "current_game_events": [],
            "scores": {},
            "voting": {
                "active": False,
                "time_remaining": 0,
                "votes": []
            },
            "viewer_count": 0
        }

    async def connect(self, websocket: WebSocket):
        """接受新的WebSocket连接并发送完整数据"""
        self.active_connections.append(websocket)
        self.connection_count += 1
        self.tournament_data["viewer_count"] = self.connection_count
        
        # 立即发送完整的当前状态给新连接
        await self.send_complete_data()

    def disconnect(self, websocket: WebSocket):
        """断开WebSocket连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            self.connection_count -= 1
            self.tournament_data["viewer_count"] = self.connection_count
            asyncio.create_task(self.send_complete_data())

    async def send_complete_data(self):
        """发送完整的比赛数据给所有连接"""
        if self.active_connections:
            message_str = json.dumps(self.tournament_data, ensure_ascii=False, default=str)
            disconnected = []
            
            for connection in self.active_connections:
                try:
                    await connection.send_text(message_str)
                except:
                    disconnected.append(connection)
            
            # 清理断开的连接
            for connection in disconnected:
                if connection in self.active_connections:
                    self.active_connections.remove(connection)
                    self.connection_count -= 1
            
            # 如果清理了连接，更新观看人数
            if disconnected:
                self.tournament_data["viewer_count"] = self.connection_count

    async def update_tournament_status(self, status: str, game_name: str = None, round_num: int = None):
        """更新锦标赛状态"""
        self.tournament_data["tournament"]["status"] = status
        if game_name:
            self.tournament_data["tournament"]["current_game"] = game_name
        if round_num:
            self.tournament_data["tournament"]["current_round"] = round_num
        
        await self.send_complete_data()

    async def update_leaderboard(self, teams_data: List[Dict], players_data: List[Dict]):
        """更新积分榜"""
        self.tournament_data["leaderboard"]["teams"] = teams_data
        self.tournament_data["leaderboard"]["players"] = players_data
        await self.send_complete_data()

    async def add_game_event(self, event_data: Dict):
        """添加游戏事件"""
        self.tournament_data["current_game_events"].insert(0, event_data)
        # 只保留最新50条事件
        self.tournament_data["current_game_events"] = self.tournament_data["current_game_events"][:50]
        await self.send_complete_data()

    async def update_scores(self, scores_data: Dict):
        """更新分数数据"""
        self.tournament_data["scores"].update(scores_data)
        await self.send_complete_data()

    async def initialize_from_database(self):
        """从数据库初始化完整数据"""
        from app.core.database import get_db_session, Tournament, Team, Player
        
        db = get_db_session()
        try:
            # 获取锦标赛信息
            tournament = db.query(Tournament).first()
            if tournament:
                self.tournament_data["tournament"] = {
                    "id": tournament.id,
                    "name": tournament.name,
                    "status": tournament.status,
                    "current_game": tournament.current_game or "",
                    "current_round": tournament.current_round
                }
            
            # 获取队伍排行榜
            teams = db.query(Team).order_by(Team.total_score.desc()).all()
            self.tournament_data["leaderboard"]["teams"] = [
                {"name": team.name, "score": team.total_score} for team in teams
            ]
            
            # 获取玩家排行榜
            players = db.query(Player).order_by(Player.total_score.desc()).all()
            self.tournament_data["leaderboard"]["players"] = [
                {"name": player.name, "score": player.total_score, "team": ""} for player in players
            ]
            
        finally:
            db.close()

    async def update_leaderboard_from_database(self):
        """从数据库更新积分榜"""
        await self.initialize_from_database()
        await self.send_complete_data()

    async def update_voting(self, voting_data: Dict):
        """更新投票数据"""
        self.tournament_data["voting"] = voting_data
        await self.send_complete_data()

    # 保留旧方法以兼容现有代码
    async def broadcast_game_event(self, game_id: str, event_data: Dict):
        """兼容方法：添加游戏事件"""
        event_data["game_id"] = game_id
        await self.add_game_event(event_data)

    async def broadcast_score_update(self, data: Dict):
        """兼容方法：更新分数"""
        if "scores" in data:
            scores = {}
            for score in data["scores"]:
                # 处理不同的数据结构
                if isinstance(score, dict) and "player" in score:
                    # 优先使用 weighted_score，然后是 score
                    if "weighted_score" in score:
                        scores[score["player"]] = score["weighted_score"]
                    elif "score" in score:
                        scores[score["player"]] = score["score"]
                    # 兼容旧的数据结构
                    elif hasattr(score, 'score'):
                        scores[score["player"]] = getattr(score, 'score')
            await self.update_scores(scores)
        else:
            # 如果没有scores字段，只更新其他数据
            await self.send_complete_data()

    async def broadcast_global_event(self, data: Dict):
        """兼容方法：更新全局状态"""
        status = data.get("status")
        game_info = data.get("game")
        game_name = game_info.get("name") if game_info else None
        round_num = game_info.get("round") if game_info else None
        await self.update_tournament_status(status, game_name, round_num)

    async def broadcast_vote_event(self, data: Dict):
        """兼容方法：更新投票"""
        voting_data = {
            "active": True,
            "time_remaining": data.get("time", 60),
            "votes": data.get("votes", [])
        }
        await self.update_voting(voting_data)

# 全局WebSocket管理器实例
# 在整个应用中共享使用，确保所有连接的统一管理
manager = WebSocketManager()