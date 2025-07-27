from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.database import Tournament, Team, Player, Game, GameEvent
from app.schemas.schemas import TournamentResponse, TeamResponse, PlayerResponse, GameEventResponse

router = APIRouter()

@router.get("/tournament", response_model=TournamentResponse)
async def get_tournament_info(db: Session = Depends(get_db)):
    tournament = db.query(Tournament).first()
    if not tournament:
        tournament = Tournament(
            name="Minecraft Tournament",
            status="setting",
            current_game="",
            current_round=1
        )
        db.add(tournament)
        db.commit()
        db.refresh(tournament)
    
    teams = db.query(Team).filter(Team.tournament_id == tournament.id).all()
    team_responses = []
    
    for team in teams:
        players = db.query(Player).filter(Player.team_id == team.id).all()
        player_responses = [
            PlayerResponse(
                id=player.id,
                name=player.name,
                score=player.score,
                team_id=player.team_id
            )
            for player in players
        ]
        
        team_responses.append(TeamResponse(
            id=team.id,
            name=team.name,
            total_score=team.total_score,
            players=player_responses
        ))
    
    return TournamentResponse(
        id=tournament.id,
        name=tournament.name,
        status=tournament.status,
        current_game=tournament.current_game,
        current_round=tournament.current_round,
        teams=team_responses
    )

@router.get("/teams", response_model=List[TeamResponse])
async def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    team_responses = []
    
    for team in teams:
        players = db.query(Player).filter(Player.team_id == team.id).all()
        player_responses = [
            PlayerResponse(
                id=player.id,
                name=player.name,
                score=player.score,
                team_id=player.team_id
            )
            for player in players
        ]
        
        team_responses.append(TeamResponse(
            id=team.id,
            name=team.name,
            total_score=team.total_score,
            players=player_responses
        ))
    
    return team_responses

@router.get("/leaderboard")
async def get_leaderboard(db: Session = Depends(get_db)):
    teams = db.query(Team).order_by(Team.total_score.desc()).all()
    players = db.query(Player).order_by(Player.score.desc()).all()
    
    return {
        "teams": [{"name": team.name, "score": team.total_score} for team in teams],
        "players": [{"name": player.name, "score": player.score, "team": player.team_id} for player in players]
    }

@router.get("/game/{game_id}/events", response_model=List[GameEventResponse])
async def get_game_events(game_id: str, limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(GameEvent).filter(
        GameEvent.game_id == game_id
    ).order_by(GameEvent.timestamp.desc()).limit(limit).all()
    
    return [
        GameEventResponse(
            id=event.id,
            game_id=event.game_id,
            player=event.player,
            team=event.team,
            event=event.event,
            lore=event.lore,
            timestamp=event.timestamp
        )
        for event in events
    ]