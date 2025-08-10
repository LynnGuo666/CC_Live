"""
数据模型定义文件
定义了所有API端点使用的Pydantic数据模型
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


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
    color: Optional[str] = Field(None, description="队伍颜色（十六进制）")


class GameInfo(BaseModel):
    """
    游戏信息数据模型
    包含游戏名称、回合数和在锦标赛中的序号
    """
    name: str = Field(..., description="游戏名称")
    round: int = Field(..., description="当前游戏的回合数")
    tournament_number: Optional[int] = Field(None, description="游戏在锦标赛中的序号（第几项）")
    total_selected: Optional[int] = Field(None, description="锦标赛已选择的游戏总数")


class GlobalEvent(BaseModel):
    """
    全局事件数据模型
    用于/api/game/event端点
    """
    status: str = Field(..., description="游戏的当前状态，如: gaming, voting, halfing, setting")
    game: Optional[GameInfo] = Field(None, description="当前游戏信息，投票时可为空")


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


# =====================
# Bingo 相关数据模型
# =====================

class BingoTask(BaseModel):
    """
    Bingo 卡片中的单个任务
    键存储在字典中使用 "x,y" 形式（由外层 BingoCard 维护）
    """
    index: int = Field(..., description="任务索引（从0开始）")
    x: int = Field(..., description="任务在卡片中的 X 坐标（从0开始）")
    y: int = Field(..., description="任务在卡片中的 Y 坐标（从0开始）")
    name: str = Field(..., description="任务名称")
    type: str = Field(..., description="任务类型，如 ITEM/ADVANCEMENT 等")
    description: str = Field("", description="任务描述")
    material: Optional[str] = Field(None, description="物品类任务的材料标识")
    count: Optional[int] = Field(None, description="物品类任务的数量")
    completed: Optional[bool] = Field(False, description="是否完成（可选，前端展示用）")
    completedBy: Optional[str] = Field(None, description="完成者（可选，前端展示用）")
    completedAt: Optional[int] = Field(None, description="完成时间毫秒（可选，前端展示用）")


class BingoTeamMember(BaseModel):
    name: str
    displayName: str
    alwaysActive: bool


class BingoTeamInfo(BaseModel):
    name: str
    color: str
    completeCount: int
    outOfTheGame: bool
    members: Dict[str, BingoTeamMember]


class BingoCard(BaseModel):
    """
    Bingo 卡片整体结构
    与前端 `BingoCard` 类型保持一致
    """
    size: int
    width: int
    height: int
    team: Optional[BingoTeamInfo] = None
    tasks: Dict[str, BingoTask]
    timestamp: int = Field(..., description="时间戳（毫秒）")