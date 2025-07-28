"""
数据管理器
集中管理所有实时数据，包括积分榜、事件列表、投票数据等
支持定时广播机制
"""

import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from app.models.models import TeamScore, GameEvent, VoteEvent, GlobalEvent
from app.core.websocket import connection_manager
from app.core.tournament_manager import tournament_manager


class DataManager:
    def __init__(self):
        # 存储全局积分榜数据
        self.global_scores: List[TeamScore] = []
        
        # 存储当前游戏积分数据
        self.current_game_score = None
        
        # 存储投票数据
        self.current_vote_data: Optional[VoteEvent] = None
        
        # 存储游戏状态
        self.game_status = None
        
        # 存储所有事件的完整列表（带时间戳）
        self.events_history: List[Dict] = []
        
        # 广播任务引用
        self.broadcast_task = None
        
        # 是否启用定时广播
        self.auto_broadcast_enabled = True
    
    def add_event(self, event: GameEvent, game_id: str):
        """
        添加新事件到历史记录中
        
        参数:
            event (GameEvent): 游戏事件
            game_id (str): 游戏ID
        """
        event_with_timestamp = {
            "player": event.player,
            "team": event.team,
            "event": event.event,
            "lore": event.lore,
            "game_id": game_id,
            "timestamp": datetime.now().isoformat(),
            "post_time": datetime.now().isoformat()  # 添加post到服务器的时间
        }
        
        # 添加到事件历史记录
        self.events_history.append(event_with_timestamp)
        
        # 保持最新的100条事件
        if len(self.events_history) > 100:
            self.events_history = self.events_history[-100:]
        
        print(f"添加事件: {event.player} - {event.event} (游戏: {game_id})")
    
    def update_global_scores(self, team_scores: List[TeamScore]):
        """
        更新全局积分榜数据
        
        参数:
            team_scores (List[TeamScore]): 队伍分数列表
        """
        self.global_scores = team_scores
        print(f"更新全局积分榜: {len(team_scores)} 个队伍")
    
    def update_current_game_score(self, score_data):
        """
        更新当前游戏积分数据
        
        参数:
            score_data: 当前游戏积分数据
        """
        self.current_game_score = score_data
        print("更新当前游戏积分数据")
    
    def update_vote_data(self, vote_data: VoteEvent):
        """
        更新投票数据
        
        参数:
            vote_data (VoteEvent): 投票事件数据
        """
        self.current_vote_data = vote_data
        print(f"更新投票数据: {len(vote_data.votes)} 个选项, 剩余时间: {vote_data.time}秒")
    
    def update_game_status(self, event: GlobalEvent):
        """
        更新游戏状态
        
        参数:
            event (GlobalEvent): 全局事件
        """
        # 获取游戏在锦标赛中的信息
        current_game_info = tournament_manager.get_current_game_info()
        tournament_number = current_game_info["number"] if current_game_info else 0
        
        self.game_status = {
            "status": event.status,
            "game": {
                "name": event.game.name if event.game else None,
                "round": event.game.round if event.game else None,
                "tournament_number": tournament_number
            } if event.game else None
        }
        print(f"更新游戏状态: {event.status}")
    
    def get_complete_data(self) -> Dict:
        """
        获取所有完整数据用于广播
        
        返回:
            Dict: 包含所有实时数据的完整数据包
        """
        return {
            "type": "full_data_update",
            "data": {
                "globalScores": [
                    {
                        "team": team.team,
                        "total_score": team.total_score,
                        "player_count": len(team.scores),
                        "scores": [
                            {
                                "player": score.player,
                                "score": score.score
                            } for score in team.scores
                        ]
                    } for team in self.global_scores
                ],
                "currentGameScore": self.current_game_score,
                "currentVote": {
                    "time_remaining": self.current_vote_data.time,
                    "total_games": len(self.current_vote_data.votes),
                    "total_tickets": sum(vote.ticket for vote in self.current_vote_data.votes),
                    "votes": [
                        {
                            "game": vote.game,
                            "ticket": vote.ticket
                        } for vote in self.current_vote_data.votes
                    ]
                } if self.current_vote_data else None,
                "gameStatus": self.game_status,
                "recentEvents": self.events_history[-20:],  # 发送最新20条事件
                "connectionStatus": {
                    "connected": True,
                    "connection_count": connection_manager.get_connection_count(),
                    "last_ping": datetime.now().isoformat()
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    
    async def start_broadcast_scheduler(self):
        """
        启动定时广播调度器
        """
        if self.broadcast_task is not None:
            self.broadcast_task.cancel()
        
        self.broadcast_task = asyncio.create_task(self._broadcast_loop())
        print("定时广播调度器已启动")
    
    async def stop_broadcast_scheduler(self):
        """
        停止定时广播调度器
        """
        if self.broadcast_task is not None:
            self.broadcast_task.cancel()
            self.broadcast_task = None
        print("定时广播调度器已停止")
    
    async def _broadcast_loop(self):
        """
        广播循环，每秒发送一次完整数据
        """
        while self.auto_broadcast_enabled:
            try:
                if connection_manager.get_connection_count() > 0:
                    complete_data = self.get_complete_data()
                    await connection_manager.broadcast(complete_data)
                
                await asyncio.sleep(1)  # 每1秒广播一次
            except asyncio.CancelledError:
                print("广播循环被取消")
                break
            except Exception as e:
                print(f"广播循环出错: {e}")
                await asyncio.sleep(1)  # 出错后等1秒再继续
    
    def enable_auto_broadcast(self):
        """启用自动广播"""
        self.auto_broadcast_enabled = True
    
    def disable_auto_broadcast(self):
        """禁用自动广播"""
        self.auto_broadcast_enabled = False


# 全局数据管理器实例
data_manager = DataManager()