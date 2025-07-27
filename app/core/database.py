from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./tournament.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Tournament(Base):
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="setting")
    current_game = Column(String)
    current_round = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    teams = relationship("Team", back_populates="tournament")
    games = relationship("Game", back_populates="tournament")

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    total_score = Column(Integer, default=0)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    
    tournament = relationship("Tournament", back_populates="teams")
    players = relationship("Player", back_populates="team")

class Player(Base):
    __tablename__ = "players"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    score = Column(Integer, default=0)
    team_id = Column(String, ForeignKey("teams.id"))
    
    team = relationship("Team", back_populates="players")

class Game(Base):
    __tablename__ = "games"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    round_number = Column(Integer)
    status = Column(String, default="pending")
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    
    tournament = relationship("Tournament", back_populates="games")
    events = relationship("GameEvent", back_populates="game")

class GameEvent(Base):
    __tablename__ = "game_events"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey("games.id"))
    player = Column(String)
    team = Column(String)
    event = Column(String)
    lore = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    game = relationship("Game", back_populates="events")

class Vote(Base):
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    game = Column(String)
    ticket = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()