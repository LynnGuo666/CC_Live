from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.database import Vote
from app.schemas.schemas import VoteEventRequest
from app.services.websocket_manager import manager

router = APIRouter()

@router.post("/vote/event")
async def create_vote_event(
    votes: List[VoteEventRequest],
    db: Session = Depends(get_db)
):
    vote_data = []
    
    for vote_request in votes:
        vote = db.query(Vote).filter(Vote.game == vote_request.game).first()
        if vote:
            vote.ticket = vote_request.ticket
        else:
            vote = Vote(game=vote_request.game, ticket=vote_request.ticket)
            db.add(vote)
        
        vote_data.append({
            "game": vote_request.game,
            "ticket": vote_request.ticket
        })
    
    db.commit()
    
    await manager.broadcast_vote_event(vote_data)
    
    return {"status": "success", "message": "Vote events updated"}

@router.get("/vote/results")
async def get_vote_results(db: Session = Depends(get_db)):
    votes = db.query(Vote).all()
    return [{"game": vote.game, "ticket": vote.ticket} for vote in votes]