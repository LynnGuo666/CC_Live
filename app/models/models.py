from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    game_type = Column(String)
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)
    status = Column(String, default="pending")
    bilibili_room_id = Column(String)
    bilibili_url = Column(String)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # 关联关系
    events = relationship("GameEvent", back_populates="match")
    player_scores = relationship("PlayerScore", back_populates="match")
    leaderboard = relationship("MatchLeaderboard", back_populates="match")
    team_stats = relationship("TeamStat", back_populates="match")
    status_info = relationship("MatchStatus", back_populates="match", uselist=False)
    comments = relationship("Comment", back_populates="match")


class GameEvent(Base):
    __tablename__ = "game_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"))
    event_type = Column(String, nullable=False)
    player = Column(String)
    target = Column(String)
    data = Column(JSON)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("Match", back_populates="events")


class PlayerScore(Base):
    __tablename__ = "player_scores"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"))
    player_name = Column(String, nullable=False)
    score = Column(Integer, default=0)
    level = Column(Integer, default=1)
    health = Column(Integer, default=100)
    experience = Column(Integer, default=0)
    custom_stats = Column(JSON)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("Match", back_populates="player_scores")


class MatchLeaderboard(Base):
    __tablename__ = "match_leaderboard"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"))
    player_name = Column(String, nullable=False)
    rank = Column(Integer, nullable=False)
    total_score = Column(Integer, default=0)
    team = Column(String)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("Match", back_populates="leaderboard")


class TeamStat(Base):
    __tablename__ = "team_stats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"))
    team_name = Column(String, nullable=False)
    total_score = Column(Integer, default=0)
    objectives = Column(Integer, default=0)
    progress = Column(Integer, default=0)
    custom_stats = Column(JSON)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("Match", back_populates="team_stats")


class MatchStatus(Base):
    __tablename__ = "match_status"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"), unique=True)
    status = Column(String, default="pending")
    current_round = Column(Integer, default=1)
    total_rounds = Column(Integer, default=1)
    time_remaining = Column(Integer)
    game_mode = Column(String)
    custom_status = Column(JSON)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("Match", back_populates="status_info")


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String, ForeignKey("matches.id"))
    username = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("Match", back_populates="comments")