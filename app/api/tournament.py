"""
锦标赛管理API
支持多阶段比赛、投票环节等功能

主要功能:
- 创建和管理锦标赛
- 管理比赛阶段（游戏、投票、休息）
- 处理投票系统
- 实时推送锦标赛状态更新

API端点:
- POST /tournaments - 创建锦标赛
- GET /tournaments - 获取锦标赛列表
- GET /tournaments/{id} - 获取锦标赛详情
- POST /tournaments/{id}/stages - 添加阶段
- POST /tournaments/{id}/stages/{stage_id}/start - 开始阶段
- POST /voting-sessions - 创建投票会话
- POST /votes - 投票
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.models.tournament_models import (
    Tournament, TournamentStage, TournamentMatch, TournamentParticipant,
    VotingSession, VotingOption, Vote
)
from app.services.websocket_manager import websocket_manager
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# 创建锦标赛API路由器
router = APIRouter()


# Pydantic 数据模型 - 用于API请求验证
class TournamentCreate(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    bilibili_room_id: Optional[str] = None
    bilibili_url: Optional[str] = None
    max_participants: Optional[int] = None


class StageCreate(BaseModel):
    id: str
    tournament_id: str
    stage_order: int
    stage_type: str  # game, voting, break
    title: str
    description: Optional[str] = None
    game_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    config: Optional[dict] = None


class VotingSessionCreate(BaseModel):
    id: str
    tournament_id: str
    stage_id: str
    title: str
    description: Optional[str] = None
    voting_type: str
    allow_public_voting: bool = True
    max_votes_per_user: int = 1
    voting_config: Optional[dict] = None


class VoteCreate(BaseModel):
    session_id: str
    option_id: str
    voter_id: str
    voter_type: str = "user"
    vote_weight: float = 1.0


@router.post("/tournaments")
async def create_tournament(
    tournament: TournamentCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建新锦标赛"""
    db_tournament = Tournament(
        id=tournament.id,
        title=tournament.title,
        description=tournament.description,
        start_time=tournament.start_time,
        end_time=tournament.end_time,
        bilibili_room_id=tournament.bilibili_room_id,
        bilibili_url=tournament.bilibili_url,
        max_participants=tournament.max_participants
    )
    
    db.add(db_tournament)
    await db.commit()
    
    # WebSocket通知
    await websocket_manager.broadcast({
        "type": "tournament_created",
        "tournament": {
            "id": tournament.id,
            "title": tournament.title,
            "status": "pending"
        }
    })
    
    return {"message": "Tournament created successfully", "tournament_id": tournament.id}


@router.get("/tournaments")
async def list_tournaments(db: AsyncSession = Depends(get_db)):
    """获取锦标赛列表"""
    result = await db.execute(
        select(Tournament).order_by(Tournament.created_at.desc())
    )
    tournaments = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "bilibili_room_id": t.bilibili_room_id,
            "bilibili_url": t.bilibili_url,
            "created_at": t.created_at
        }
        for t in tournaments
    ]


@router.get("/tournaments/{tournament_id}")
async def get_tournament(tournament_id: str, db: AsyncSession = Depends(get_db)):
    """获取锦标赛详情"""
    result = await db.execute(
        select(Tournament).where(Tournament.id == tournament_id)
    )
    tournament = result.scalar_one_or_none()
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    return {
        "id": tournament.id,
        "title": tournament.title,
        "description": tournament.description,
        "status": tournament.status,
        "start_time": tournament.start_time,
        "end_time": tournament.end_time,
        "bilibili_room_id": tournament.bilibili_room_id,
        "bilibili_url": tournament.bilibili_url,
        "max_participants": tournament.max_participants,
        "created_at": tournament.created_at
    }


@router.post("/tournaments/{tournament_id}/stages")
async def create_stage(
    tournament_id: str,
    stage: StageCreate,
    db: AsyncSession = Depends(get_db)
):
    """为锦标赛添加阶段"""
    db_stage = TournamentStage(
        id=stage.id,
        tournament_id=tournament_id,
        stage_order=stage.stage_order,
        stage_type=stage.stage_type,
        title=stage.title,
        description=stage.description,
        game_type=stage.game_type,
        duration_minutes=stage.duration_minutes,
        config=stage.config
    )
    
    db.add(db_stage)
    await db.commit()
    
    # WebSocket通知
    await websocket_manager.broadcast({
        "type": "stage_created",
        "tournament_id": tournament_id,
        "stage": {
            "id": stage.id,
            "title": stage.title,
            "stage_type": stage.stage_type,
            "stage_order": stage.stage_order
        }
    })
    
    return {"message": "Stage created successfully", "stage_id": stage.id}


@router.get("/tournaments/{tournament_id}/stages")
async def get_tournament_stages(tournament_id: str, db: AsyncSession = Depends(get_db)):
    """获取锦标赛阶段列表"""
    result = await db.execute(
        select(TournamentStage)
        .where(TournamentStage.tournament_id == tournament_id)
        .order_by(TournamentStage.stage_order)
    )
    stages = result.scalars().all()
    
    return [
        {
            "id": stage.id,
            "tournament_id": stage.tournament_id,
            "stage_order": stage.stage_order,
            "stage_type": stage.stage_type,
            "title": stage.title,
            "description": stage.description,
            "game_type": stage.game_type,
            "start_time": stage.start_time,
            "end_time": stage.end_time,
            "duration_minutes": stage.duration_minutes,
            "status": stage.status,
            "config": stage.config
        }
        for stage in stages
    ]


@router.post("/tournaments/{tournament_id}/stages/{stage_id}/start")
async def start_stage(
    tournament_id: str,
    stage_id: str,
    db: AsyncSession = Depends(get_db)
):
    """开始某个阶段"""
    result = await db.execute(
        select(TournamentStage).where(
            TournamentStage.id == stage_id,
            TournamentStage.tournament_id == tournament_id
        )
    )
    stage = result.scalar_one_or_none()
    
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    # 更新阶段状态
    await db.execute(
        update(TournamentStage)
        .where(TournamentStage.id == stage_id)
        .values(status="in_progress", start_time=datetime.utcnow())
    )
    await db.commit()
    
    # WebSocket通知
    await websocket_manager.broadcast({
        "type": "stage_started",
        "tournament_id": tournament_id,
        "stage_id": stage_id,
        "stage_type": stage.stage_type,
        "title": stage.title
    })
    
    return {"message": "Stage started successfully"}


@router.post("/voting-sessions")
async def create_voting_session(
    voting: VotingSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建投票环节"""
    db_voting = VotingSession(
        id=voting.id,
        tournament_id=voting.tournament_id,
        stage_id=voting.stage_id,
        title=voting.title,
        description=voting.description,
        voting_type=voting.voting_type,
        allow_public_voting=voting.allow_public_voting,
        max_votes_per_user=voting.max_votes_per_user,
        voting_config=voting.voting_config
    )
    
    db.add(db_voting)
    await db.commit()
    
    return {"message": "Voting session created successfully", "session_id": voting.id}


@router.post("/voting-sessions/{session_id}/options")
async def add_voting_option(
    session_id: str,
    option_text: str,
    description: str = None,
    db: AsyncSession = Depends(get_db)
):
    """添加投票选项"""
    # 获取当前选项数量作为排序
    result = await db.execute(
        select(VotingOption).where(VotingOption.session_id == session_id)
    )
    existing_options = result.scalars().all()
    option_order = len(existing_options) + 1
    
    option_id = f"{session_id}_option_{option_order}"
    
    db_option = VotingOption(
        id=option_id,
        session_id=session_id,
        option_text=option_text,
        description=description,
        option_order=option_order
    )
    
    db.add(db_option)
    await db.commit()
    
    return {"message": "Voting option added successfully", "option_id": option_id}


@router.post("/votes")
async def cast_vote(
    vote: VoteCreate,
    db: AsyncSession = Depends(get_db)
):
    """投票"""
    # 检查用户是否已经投过票
    result = await db.execute(
        select(Vote).where(
            Vote.session_id == vote.session_id,
            Vote.voter_id == vote.voter_id
        )
    )
    existing_votes = result.scalars().all()
    
    # 获取投票会话配置
    session_result = await db.execute(
        select(VotingSession).where(VotingSession.id == vote.session_id)
    )
    voting_session = session_result.scalar_one_or_none()
    
    if not voting_session:
        raise HTTPException(status_code=404, detail="Voting session not found")
    
    if len(existing_votes) >= voting_session.max_votes_per_user:
        raise HTTPException(status_code=400, detail="Vote limit exceeded")
    
    # 记录投票
    db_vote = Vote(
        session_id=vote.session_id,
        option_id=vote.option_id,
        voter_id=vote.voter_id,
        voter_type=vote.voter_type,
        vote_weight=vote.vote_weight
    )
    
    db.add(db_vote)
    
    # 更新选项票数
    await db.execute(
        update(VotingOption)
        .where(VotingOption.id == vote.option_id)
        .values(vote_count=VotingOption.vote_count + 1)
    )
    
    await db.commit()
    
    # WebSocket通知投票更新
    await websocket_manager.broadcast({
        "type": "vote_cast",
        "session_id": vote.session_id,
        "option_id": vote.option_id,
        "voter_type": vote.voter_type
    })
    
    return {"message": "Vote cast successfully"}


@router.get("/voting-sessions/{session_id}/results")
async def get_voting_results(session_id: str, db: AsyncSession = Depends(get_db)):
    """获取投票结果"""
    result = await db.execute(
        select(VotingOption)
        .where(VotingOption.session_id == session_id)
        .order_by(VotingOption.vote_count.desc())
    )
    options = result.scalars().all()
    
    total_votes = sum(option.vote_count for option in options)
    
    return {
        "session_id": session_id,
        "total_votes": total_votes,
        "options": [
            {
                "id": option.id,
                "option_text": option.option_text,
                "description": option.description,
                "vote_count": option.vote_count,
                "percentage": round((option.vote_count / total_votes * 100) if total_votes > 0 else 0, 2)
            }
            for option in options
        ]
    }