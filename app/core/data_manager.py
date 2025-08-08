"""
数据管理器
集中管理所有实时数据，包括积分榜、事件列表、投票数据等
支持定时广播机制
"""

import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from app.models.models import TeamScore, GameEvent, VoteEvent, GlobalEvent, BingoCard
from app.core.websocket import connection_manager
from app.core.tournament_manager import tournament_manager
from app.core.score_engine import score_engine


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
        
        # Bingo 卡片（如果收到则存储并广播）
        self.bingo_card: Optional[BingoCard] = None
    
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
        full_data = {
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
                "bingoCard": self._serialize_bingo_card() if self.bingo_card else None,
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

        # 针对跑路战士，附带检查点与完成路线汇总，方便前端渲染
        try:
            if score_engine.current_game_id == 'runaway_warrior':
                summary = self._build_runaway_warrior_summary()
                full_data["data"]["runawayWarrior"] = summary
        except Exception as e:
            print(f"构建跑路战士汇总信息失败: {e}")

        return full_data

    def update_bingo_card(self, card: BingoCard):
        """更新 Bingo 卡片，并准备广播"""
        self.bingo_card = card
        print("更新 Bingo 卡片: {}x{} size={}".format(card.width, card.height, card.size))

    def _serialize_bingo_card(self) -> Dict:
        """将 BingoCard 转为可 JSON 序列化的 dict，以与前端类型兼容"""
        if not self.bingo_card:
            return None
        # Pydantic BaseModel 的 dict() 即可满足，但确保 keys 为字符串 "x,y"
        return self.bingo_card.dict()

    def _build_runaway_warrior_summary(self) -> Dict:
        """
        从分数引擎的内部状态构建跑路战士的检查点、通过人数与完成路线统计。
        结构示例：
        {
          "checkpoints": {
            "main0": { count: 5, players: ["p1", "p2"...] },
            "check0": { count: 3, players: [...] },
            ...
          },
          "completion": { ez: 2, mid: 5, hard: 1 },
          "order": ["main0", "check0", "check1", "check2", "sub1-0", "sub1-1", "sub1-2", "main1", ..., "main5" ]
        }
        """
        state = score_engine.runaway_warrior_state
        checkpoint_progress = state.get('checkpoint_progress', {})  # dict[player] -> List[str]
        completion_routes = state.get('completion_routes', {})       # dict[player] -> route_type

        # 聚合各检查点通过玩家与数量
        checkpoints: Dict[str, Dict[str, object]] = {}
        for player, checkpoints_list in checkpoint_progress.items():
            for cp in checkpoints_list:
                if cp not in checkpoints:
                    checkpoints[cp] = {"count": 0, "players": []}
                checkpoints[cp]["count"] = int(checkpoints[cp]["count"]) + 1
                checkpoints[cp]["players"].append(player)

        # 统计完成路线（将 simple/normal/hard 映射为 ez/mid/hard 以兼容前端文案）
        completion = {"ez": 0, "mid": 0, "hard": 0, "other": 0}
        for player, route in completion_routes.items():
            key = route
            if route == 'simple':
                key = 'ez'
            elif route == 'normal':
                key = 'mid'
            elif route == 'hard':
                key = 'hard'
            if key in completion:
                completion[key] += 1
            else:
                completion['other'] += 1

        # 预设顺序（若检查点命名与此不同，前端仍可从 checkpoints 字典遍历）
        order = [
            "main0", "check0", "check1", "check2",
            "sub1-0", "sub1-1", "sub1-2",
            "main1", "main2", "main3", "main4", "main5",
            # 完成阶段（显示在末尾）
            "finish-ez-0", "finish-ez-1",
            "finish-mid-0", "finish-mid-1", "finish-mid-2",
            "finish-hard-0", "finish-hard-1", "finish-hard-2",
        ]

        return {
            "checkpoints": checkpoints,
            "completion": completion,
            "order": order
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