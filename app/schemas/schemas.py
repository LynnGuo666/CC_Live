from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GameEventRequest(BaseModel):
    player: str
    team: str
    event: str
    lore: str

class GameScoreRequest(BaseModel):
    player: str
    team: str
    score: int

class PlayerScore(BaseModel):
    player: str
    score: int

class GlobalScoreRequest(BaseModel):
    team: str
    total_score: int
    scores: List[PlayerScore]

class GameInfo(BaseModel):
    name: str
    round: int

class GlobalEventRequest(BaseModel):
    status: str
    game: Optional[GameInfo] = None

class VoteEventRequest(BaseModel):
    game: str
    ticket: int

class VoteEventWithTime(BaseModel):
    votes: List[VoteEventRequest]
    time: int = 60  # 默认60秒倒计时

class PlayerResponse(BaseModel):
    id: str
    name: str
    score: int
    team_id: str

class TeamResponse(BaseModel):
    id: str
    name: str
    total_score: int
    players: List[PlayerResponse]

class GameEventResponse(BaseModel):
    id: int
    game_id: str
    player: str
    team: str
    event: str
    lore: str
    timestamp: datetime

class TournamentResponse(BaseModel):
    id: int
    name: str
    status: str
    current_game: Optional[str]
    current_round: int
    teams: List[TeamResponse]