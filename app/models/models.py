"""
数据模型定义文件
定义了所有API端点使用的Pydantic数据模型
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class GameEvent(BaseModel):
    """
    游戏事件数据模型
    用于/api/<id>/event端点
    """
    player: str = Field(..., description="触发事件的玩家ID")
    team: str = Field(..., description="玩家所在的队伍ID")
    event: str = Field(..., description="事件类型")
    lore: str = Field(..., description="事件的附加信息或元数据")


class ScoreUpdate(BaseModel):
    """
    分数更新数据模型
    用于/api/<id>/score端点
    """
    player: str = Field(..., description="玩家ID")
    team: str = Field(..., description="玩家所在的队伍ID")
    score: int = Field(..., description="玩家在该次更新中获得或变更的分数")


class PlayerScore(BaseModel):
    """
    玩家分数数据模型
    用于全局分数更新中的玩家个人分数
    """
    player: str = Field(..., description="玩家ID")
    score: int = Field(..., description="玩家的个人总分")


class TeamScore(BaseModel):
    """
    队伍分数数据模型
    用于/api/game/score端点
    """
    team: str = Field(..., description="队伍ID")
    total_score: int = Field(..., description="队伍当前的总分数")
    scores: List[PlayerScore] = Field(..., description="该队伍所有玩家及其个人分数")


class GameInfo(BaseModel):
    """
    游戏信息数据模型
    包含游戏名称和回合数
    """
    name: str = Field(..., description="游戏名称")
    round: int = Field(..., description="当前游戏的回合数")


class GlobalEvent(BaseModel):
    """
    全局事件数据模型
    用于/api/game/event端点
    """
    status: str = Field(..., description="游戏的当前状态，如: gaming, voting, halfing, setting")
    game: GameInfo = Field(..., description="当前游戏信息")


class VoteGame(BaseModel):
    """
    投票游戏数据模型
    单个游戏的投票信息
    """
    game: str = Field(..., description="被投票的游戏名称")
    ticket: int = Field(..., description="该游戏获得的票数")


class VoteEvent(BaseModel):
    """
    投票事件数据模型
    用于/api/vote/event端点
    注意：API文档中的格式与实际需要的格式不同，这里按照实际使用修复
    """
    votes: List[VoteGame] = Field(..., description="投票数据列表")
    time: int = Field(..., description="投票剩余时间，倒计时，单位为秒")