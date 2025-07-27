"""
比赛数据查询API模块

功能:
- 提供比赛数据的查询接口
- 支持获取比赛详情、事件列表、玩家分数等
- 为前端提供实时数据展示支持

API端点:
- GET /{match_id} - 获取比赛详情
- GET /{match_id}/events - 获取比赛事件列表  
- GET /{match_id}/player-scores - 获取玩家分数
- GET /{match_id}/leaderboard - 获取排行榜
- GET /{match_id}/team-stats - 获取团队统计
- GET /{match_id}/status - 获取比赛状态
- GET /{match_id}/comments - 获取比赛评论
- GET / - 获取所有比赛列表
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.tournament_models import TournamentMatch, GameEvent, PlayerScore, MatchLeaderboard, TeamStat, Comment
from typing import List

# 创建比赛查询API路由器
router = APIRouter()


@router.get("/{match_id}")
async def get_match(match_id: str, db: AsyncSession = Depends(get_db)):
    """获取比赛信息"""
    result = await db.execute(select(TournamentMatch).where(TournamentMatch.id == match_id))
    match = result.scalar_one_or_none()
    
    if not match:
        raise HTTPException(status_code=404, detail="比赛未找到")
    
    return {
        "id": match.id,
        "title": match.title,
        "description": match.description,
        "game_type": match.game_type,
        "start_time": match.start_time,
        "end_time": match.end_time,
        "status": match.status,
        "bilibili_room_id": match.bilibili_room_id,
        "bilibili_url": match.bilibili_url,
        "created_at": match.created_at
    }


@router.get("/{match_id}/events")
async def get_match_events(
    match_id: str, 
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """获取比赛事件列表"""
    result = await db.execute(
        select(GameEvent)
        .where(GameEvent.match_id == match_id)
        .order_by(GameEvent.timestamp.desc())
        .limit(limit)
    )
    events = result.scalars().all()
    
    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "player": event.player,
            "target": event.target,
            "data": event.data,
            "timestamp": event.timestamp
        }
        for event in events
    ]


@router.get("/{match_id}/player-scores")
async def get_player_scores(match_id: str, db: AsyncSession = Depends(get_db)):
    """获取玩家分数"""
    result = await db.execute(
        select(PlayerScore)
        .where(PlayerScore.match_id == match_id)
        .order_by(PlayerScore.score.desc())
    )
    scores = result.scalars().all()
    
    return [
        {
            "player_name": score.player_name,
            "score": score.score,
            "level": score.level,
            "health": score.health,
            "experience": score.experience,
            "custom_stats": score.custom_stats,
            "timestamp": score.timestamp
        }
        for score in scores
    ]


@router.get("/{match_id}/leaderboard")
async def get_leaderboard(match_id: str, db: AsyncSession = Depends(get_db)):
    """获取排行榜"""
    result = await db.execute(
        select(MatchLeaderboard)
        .where(MatchLeaderboard.match_id == match_id)
        .order_by(MatchLeaderboard.rank)
    )
    leaderboard = result.scalars().all()
    
    return [
        {
            "rank": entry.rank,
            "player_name": entry.player_name,
            "total_score": entry.total_score,
            "team": entry.team,
            "timestamp": entry.timestamp
        }
        for entry in leaderboard
    ]


@router.get("/{match_id}/team-stats")
async def get_team_stats(match_id: str, db: AsyncSession = Depends(get_db)):
    """获取团队统计"""
    result = await db.execute(
        select(TeamStat)
        .where(TeamStat.match_id == match_id)
        .order_by(TeamStat.total_score.desc())
    )
    teams = result.scalars().all()
    
    return [
        {
            "team_name": team.team_name,
            "total_score": team.total_score,
            "objectives": team.objectives,
            "progress": team.progress,
            "custom_stats": team.custom_stats,
            "timestamp": team.timestamp
        }
        for team in teams
    ]


@router.get("/{match_id}/status")
async def get_match_status(match_id: str, db: AsyncSession = Depends(get_db)):
    """获取比赛状态"""
    result = await db.execute(
        select(TournamentMatch).where(TournamentMatch.id == match_id)
    )
    match = result.scalar_one_or_none()
    
    if not match:
        return {
            "match_id": match_id,
            "status": "not_found",
            "message": "比赛未找到"
        }
    
    return {
        "match_id": match.id,
        "status": match.status,
        "current_round": match.current_round,
        "total_rounds": match.total_rounds,
        "time_remaining": match.time_remaining,
        "game_mode": match.game_mode,
        "match_config": match.match_config,
        "start_time": match.start_time,
        "end_time": match.end_time
    }


@router.get("/{match_id}/comments")
async def get_comments(
    match_id: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """获取比赛评论"""
    result = await db.execute(
        select(Comment)
        .where(Comment.match_id == match_id)
        .order_by(Comment.timestamp.desc())
        .limit(limit)
    )
    comments = result.scalars().all()
    
    return [
        {
            "id": comment.id,
            "username": comment.username,
            "content": comment.content,
            "timestamp": comment.timestamp
        }
        for comment in comments
    ]


@router.get("/")
async def list_matches(db: AsyncSession = Depends(get_db)):
    """获取所有比赛列表"""
    result = await db.execute(
        select(TournamentMatch).order_by(TournamentMatch.start_time.desc())
    )
    matches = result.scalars().all()
    
    return [
        {
            "id": match.id,
            "title": match.title,
            "game_type": match.game_type,
            "status": match.status,
            "start_time": match.start_time,
            "created_at": match.created_at
        }
        for match in matches
    ]