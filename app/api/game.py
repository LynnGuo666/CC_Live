from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.database import GameEvent, Game
from app.schemas.schemas import GameEventRequest, GameScoreRequest, GlobalScoreRequest, GlobalEventRequest
from app.services.websocket_manager import manager
from app.services.score_prediction import score_predictor

router = APIRouter()

@router.post("/{game_id}/event")
async def create_game_event(
    game_id: str,
    event_data: GameEventRequest,
    db: Session = Depends(get_db)
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        game = Game(id=game_id, name=game_id, round_number=1, tournament_id=1)
        db.add(game)
        db.commit()
    
    game_event = GameEvent(
        game_id=game_id,
        player=event_data.player,
        team=event_data.team,
        event=event_data.event,
        lore=event_data.lore
    )
    
    db.add(game_event)
    db.commit()
    db.refresh(game_event)
    
    # 处理分数预测
    prediction_result = score_predictor.process_event(game_id, {
        "event": event_data.event,
        "player": event_data.player,
        "team": event_data.team,
        "lore": event_data.lore
    })
    
    # 广播事件和分数预测
    await manager.broadcast_game_event(game_id, {
        "player": event_data.player,
        "team": event_data.team,
        "event": event_data.event,
        "lore": event_data.lore,
        "timestamp": game_event.timestamp.isoformat(),
        "score_predictions": prediction_result.get("score_predictions", {}),
        "predicted_scores": prediction_result.get("total_predicted_scores", {})
    })
    
    return {
        "status": "success", 
        "message": "Event recorded",
        "score_predictions": prediction_result.get("score_predictions", {}),
        "predicted_scores": prediction_result.get("total_predicted_scores", {})
    }

@router.post("/{game_id}/score")
async def update_game_scores(
    game_id: str,
    scores: List[GameScoreRequest],
    db: Session = Depends(get_db)
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        game = Game(id=game_id, name=game_id, round_number=1, tournament_id=1)
        db.add(game)
        db.commit()
    
    score_updates = []
    actual_scores = {}
    
    for score_data in scores:
        score_updates.append({
            "player": score_data.player,
            "team": score_data.team,
            "score": score_data.score
        })
        # 更新实际分数
        actual_scores[score_data.player] = score_data.score
    
    # 更新分数预测器的实际分数
    score_predictor.update_actual_scores(game_id, actual_scores)
    
    # 获取预测对比
    score_comparison = score_predictor.get_score_comparison(game_id)
    
    await manager.broadcast_score_update({
        "game_id": game_id,
        "scores": score_updates,
        "score_comparison": score_comparison
    })
    
    return {
        "status": "success", 
        "message": "Scores updated",
        "score_comparison": score_comparison
    }

@router.post("/{game_id}/initialize")
async def initialize_game(
    game_id: str,
    teams: List[str],
    players: dict,  # {"team_id": ["player1", "player2", ...]}
    db: Session = Depends(get_db)
):
    """初始化游戏以进行分数预测"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        game = Game(id=game_id, name=game_id, round_number=1, tournament_id=1)
        db.add(game)
        db.commit()
    
    # 初始化分数预测引擎
    score_predictor.initialize_game(game_id, teams, players)
    
    return {
        "status": "success",
        "message": f"Game {game_id} initialized for score prediction",
        "teams": teams,
        "players": players
    }

@router.get("/{game_id}/predictions")
async def get_score_predictions(game_id: str):
    """获取当前的分数预测"""
    score_comparison = score_predictor.get_score_comparison(game_id)
    return {
        "game_id": game_id,
        "score_comparison": score_comparison
    }

@router.post("/game/score")
async def update_global_scores(
    scores: List[GlobalScoreRequest],
    db: Session = Depends(get_db)
):
    from app.core.database import Team, Player
    
    for team_data in scores:
        team = db.query(Team).filter(Team.id == team_data.team).first()
        if not team:
            team = Team(id=team_data.team, name=team_data.team, tournament_id=1)
            db.add(team)
        
        team.total_score = team_data.total_score
        
        for player_score in team_data.scores:
            player = db.query(Player).filter(Player.id == player_score.player).first()
            if not player:
                player = Player(
                    id=player_score.player, 
                    name=player_score.player, 
                    team_id=team_data.team
                )
                db.add(player)
            
            player.score = player_score.score
    
    db.commit()
    
    await manager.broadcast_score_update({
        "type": "global",
        "teams": [
            {
                "team": team_data.team,
                "total_score": team_data.total_score,
                "players": [
                    {"player": p.player, "score": p.score} 
                    for p in team_data.scores
                ]
            }
            for team_data in scores
        ]
    })
    
    return {"status": "success", "message": "Global scores updated"}

@router.post("/game/event")
async def create_global_event(
    event_data: GlobalEventRequest,
    db: Session = Depends(get_db)
):
    from app.core.database import Tournament
    
    tournament = db.query(Tournament).first()
    if not tournament:
        tournament = Tournament(
            name="Minecraft Tournament",
            status=event_data.status,
            current_game=event_data.game.name,
            current_round=event_data.game.round
        )
        db.add(tournament)
    else:
        tournament.status = event_data.status
        tournament.current_game = event_data.game.name
        tournament.current_round = event_data.game.round
    
    db.commit()
    
    await manager.broadcast_global_event({
        "status": event_data.status,
        "game": {
            "name": event_data.game.name,
            "round": event_data.game.round
        }
    })
    
    return {"status": "success", "message": "Global event updated"}