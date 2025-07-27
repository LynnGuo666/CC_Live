from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.database import Game, GameEvent

router = APIRouter()

@router.get("/matches/{game_id}")
async def get_match_info(game_id: str, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        return {"error": "Game not found"}
    
    events = db.query(GameEvent).filter(
        GameEvent.game_id == game_id
    ).order_by(GameEvent.timestamp.desc()).limit(20).all()
    
    return {
        "game": {
            "id": game.id,
            "name": game.name,
            "round": game.round_number,
            "status": game.status
        },
        "events": [
            {
                "player": event.player,
                "team": event.team,
                "event": event.event,
                "lore": event.lore,
                "timestamp": event.timestamp.isoformat()
            }
            for event in events
        ]
    }