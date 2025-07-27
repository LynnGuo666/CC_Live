"""
游戏数据接收API模块

功能:
- 接收游戏服务器POST的各类数据
- 实时推送数据到WebSocket客户端
- 支持游戏事件、玩家分数、排行榜、比赛状态、团队统计

API接口:
- POST /events - 游戏事件
- POST /player-scores - 玩家分数更新
- POST /match-leaderboard - 排行榜更新
- POST /match-status - 比赛状态更新
- POST /team-stats - 团队统计更新
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.models.tournament_models import GameEvent, PlayerScore, MatchLeaderboard, TeamStat
from app.schemas.schemas import (
    GameEventCreate, PlayerScoreUpdate, LeaderboardUpdate, 
    MatchStatusUpdate, TeamStatsUpdate
)
from app.services.websocket_manager import websocket_manager
from datetime import datetime

# 创建API路由器 - 处理游戏服务器数据接收
router = APIRouter()


@router.post("/events")
async def create_game_event(
    event: GameEventCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    接收游戏事件数据
    
    功能:
    - 保存游戏内发生的实时事件
    - 通过WebSocket推送给所有连接的客户端
    - 支持玩家行为、成就、物品获取等事件类型
    
    参数:
    - event: 游戏事件数据，包含事件类型、玩家、时间等信息
    
    返回:
    - 事件创建成功消息和事件ID
    """
    # 创建数据库事件记录
    db_event = GameEvent(
        match_id=event.match_id,
        event_type=event.event_type,
        player=event.player,
        target=event.target,
        data=event.data,
        timestamp=event.timestamp or datetime.utcnow()
    )
    
    # 保存到数据库
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    
    # 通过WebSocket实时推送给前端
    await websocket_manager.broadcast({
        "type": "game_event",
        "match_id": event.match_id,
        "event": {
            "id": db_event.id,
            "event_type": event.event_type,
            "player": event.player,
            "target": event.target,
            "data": event.data,
            "timestamp": db_event.timestamp.isoformat()
        }
    })
    
    return {"message": "Event created successfully", "event_id": db_event.id}


@router.post("/player-scores")
async def update_player_scores(
    data: PlayerScoreUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新玩家分数数据"""
    for player in data.players:
        # 检查是否存在记录
        result = await db.execute(
            select(PlayerScore).where(
                PlayerScore.match_id == data.match_id,
                PlayerScore.player_name == player.player_name
            )
        )
        existing_score = result.scalar_one_or_none()
        
        if existing_score:
            # 更新现有记录
            existing_score.score = player.score
            existing_score.level = player.level
            existing_score.health = player.health
            existing_score.experience = player.experience
            existing_score.custom_stats = player.custom_stats
            existing_score.timestamp = data.timestamp or datetime.utcnow()
        else:
            # 创建新记录
            db_score = PlayerScore(
                match_id=data.match_id,
                player_name=player.player_name,
                score=player.score,
                level=player.level,
                health=player.health,
                experience=player.experience,
                custom_stats=player.custom_stats,
                timestamp=data.timestamp or datetime.utcnow()
            )
            db.add(db_score)
    
    await db.commit()
    
    # WebSocket推送
    await websocket_manager.broadcast({
        "type": "player_scores_update",
        "match_id": data.match_id,
        "players": [player.dict() for player in data.players]
    })
    
    return {"message": "Player scores updated successfully"}


@router.post("/match-leaderboard")
async def update_leaderboard(
    data: LeaderboardUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新比赛排行榜"""
    # 删除现有排行榜
    await db.execute(
        delete(MatchLeaderboard).where(MatchLeaderboard.match_id == data.match_id)
    )
    
    # 插入新排行榜
    for entry in data.leaderboard:
        db_entry = MatchLeaderboard(
            match_id=data.match_id,
            player_name=entry.player_name,
            rank=entry.rank,
            total_score=entry.total_score,
            team=entry.team,
            timestamp=data.timestamp or datetime.utcnow()
        )
        db.add(db_entry)
    
    await db.commit()
    
    # WebSocket推送
    await websocket_manager.broadcast({
        "type": "leaderboard_update",
        "match_id": data.match_id,
        "leaderboard": [entry.dict() for entry in data.leaderboard]
    })
    
    return {"message": "Leaderboard updated successfully"}


@router.post("/match-status")
async def update_match_status(
    data: MatchStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新比赛状态"""
    result = await db.execute(
        select(MatchStatus).where(MatchStatus.match_id == data.match_id)
    )
    existing_status = result.scalar_one_or_none()
    
    if existing_status:
        # 更新现有状态
        existing_status.status = data.status
        existing_status.current_round = data.current_round
        existing_status.total_rounds = data.total_rounds
        existing_status.time_remaining = data.time_remaining
        existing_status.game_mode = data.game_mode
        existing_status.custom_status = data.custom_status
        existing_status.updated_at = datetime.utcnow()
    else:
        # 创建新状态
        db_status = MatchStatus(
            match_id=data.match_id,
            status=data.status,
            current_round=data.current_round,
            total_rounds=data.total_rounds,
            time_remaining=data.time_remaining,
            game_mode=data.game_mode,
            custom_status=data.custom_status
        )
        db.add(db_status)
    
    await db.commit()
    
    # WebSocket推送
    await websocket_manager.broadcast({
        "type": "match_status_update",
        "match_id": data.match_id,
        "status": data.dict()
    })
    
    return {"message": "Match status updated successfully"}


@router.post("/team-stats")
async def update_team_stats(
    data: TeamStatsUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新团队统计数据"""
    for team in data.teams:
        # 检查是否存在记录
        result = await db.execute(
            select(TeamStat).where(
                TeamStat.match_id == data.match_id,
                TeamStat.team_name == team.team_name
            )
        )
        existing_stat = result.scalar_one_or_none()
        
        if existing_stat:
            # 更新现有记录
            existing_stat.total_score = team.total_score
            existing_stat.objectives = team.objectives
            existing_stat.progress = team.progress
            existing_stat.custom_stats = team.custom_stats
            existing_stat.timestamp = data.timestamp or datetime.utcnow()
        else:
            # 创建新记录
            db_stat = TeamStat(
                match_id=data.match_id,
                team_name=team.team_name,
                total_score=team.total_score,
                objectives=team.objectives,
                progress=team.progress,
                custom_stats=team.custom_stats,
                timestamp=data.timestamp or datetime.utcnow()
            )
            db.add(db_stat)
    
    await db.commit()
    
    # WebSocket推送
    await websocket_manager.broadcast({
        "type": "team_stats_update",
        "match_id": data.match_id,
        "teams": [team.dict() for team in data.teams]
    })
    
    return {"message": "Team stats updated successfully"}