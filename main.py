from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

from app.api import game, matches, tournament, websocket, vote
from app.core.database import init_db

app = FastAPI(title="Minecraft Tournament Live Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api", tags=["game"])
app.include_router(matches.router, prefix="/api", tags=["matches"])
app.include_router(tournament.router, prefix="/api", tags=["tournament"])
app.include_router(vote.router, prefix="/api", tags=["vote"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

@app.on_event("startup")
async def startup_event():
    init_db()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)