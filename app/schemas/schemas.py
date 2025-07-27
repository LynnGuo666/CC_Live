from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class GameEventCreate(BaseModel):
    match_id: str
    event_type: str
    player: Optional[str] = None
    target: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None


class PlayerScoreData(BaseModel):
    player_name: str
    score: int = 0
    level: int = 1
    health: int = 100
    experience: int = 0
    custom_stats: Optional[Dict[str, Any]] = None


class PlayerScoreUpdate(BaseModel):
    match_id: str
    timestamp: Optional[datetime] = None
    players: List[PlayerScoreData]


class LeaderboardEntry(BaseModel):
    rank: int
    player_name: str
    total_score: int
    team: Optional[str] = None


class LeaderboardUpdate(BaseModel):
    match_id: str
    timestamp: Optional[datetime] = None
    leaderboard: List[LeaderboardEntry]


class MatchStatusUpdate(BaseModel):
    match_id: str
    status: str
    current_round: Optional[int] = 1
    total_rounds: Optional[int] = 1
    time_remaining: Optional[int] = None
    game_mode: Optional[str] = None
    custom_status: Optional[Dict[str, Any]] = None


class TeamStatsData(BaseModel):
    team_name: str
    total_score: int = 0
    objectives: int = 0
    progress: int = 0
    custom_stats: Optional[Dict[str, Any]] = None


class TeamStatsUpdate(BaseModel):
    match_id: str
    timestamp: Optional[datetime] = None
    teams: List[TeamStatsData]


class CommentCreate(BaseModel):
    match_id: str
    username: str
    content: str