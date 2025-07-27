"""
完整的比赛数据模型
支持多小游戏比赛、投票环节、阶段管理等功能
"""

from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, Boolean, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Tournament(Base):
    """比赛/锦标赛表 - 顶级比赛容器"""
    __tablename__ = "tournaments"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)
    status = Column(String, default="pending")  # pending, in_progress, finished
    bilibili_room_id = Column(String)
    bilibili_url = Column(String)
    max_participants = Column(Integer)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # 关联关系
    stages = relationship("TournamentStage", back_populates="tournament", order_by="TournamentStage.stage_order")
    participants = relationship("TournamentParticipant", back_populates="tournament")


class TournamentStage(Base):
    """比赛阶段表 - 小游戏或投票环节"""
    __tablename__ = "tournament_stages"
    
    id = Column(String, primary_key=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    stage_order = Column(Integer, nullable=False)  # 阶段顺序
    stage_type = Column(String, nullable=False)  # game, voting, break
    title = Column(String, nullable=False)
    description = Column(Text)
    game_type = Column(String)  # 宾果时速、跑酷追击等
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)
    duration_minutes = Column(Integer)  # 预计时长（分钟）
    status = Column(String, default="pending")  # pending, in_progress, finished
    config = Column(JSON)  # 阶段特定配置
    
    # 关联关系
    tournament = relationship("Tournament", back_populates="stages")
    matches = relationship("TournamentMatch", back_populates="stage")
    voting_sessions = relationship("VotingSession", back_populates="stage")


class TournamentMatch(Base):
    """具体比赛/对局表"""
    __tablename__ = "tournament_matches"
    
    id = Column(String, primary_key=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    stage_id = Column(String, ForeignKey("tournament_stages.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)
    status = Column(String, default="pending")
    current_round = Column(Integer, default=1)
    total_rounds = Column(Integer, default=1)
    time_remaining = Column(Integer)
    game_mode = Column(String)
    match_config = Column(JSON)  # 比赛特定配置
    
    # 关联关系
    stage = relationship("TournamentStage", back_populates="matches")
    events = relationship("GameEvent", back_populates="match")
    player_scores = relationship("PlayerScore", back_populates="match")
    leaderboard = relationship("MatchLeaderboard", back_populates="match")
    team_stats = relationship("TeamStat", back_populates="match")
    comments = relationship("Comment", back_populates="match")


class TournamentParticipant(Base):
    """比赛参与者表"""
    __tablename__ = "tournament_participants"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    player_name = Column(String, nullable=False)
    team_name = Column(String)
    join_time = Column(TIMESTAMP, default=datetime.utcnow)
    status = Column(String, default="active")  # active, eliminated, banned
    total_score = Column(Integer, default=0)  # 总积分
    total_wins = Column(Integer, default=0)
    total_losses = Column(Integer, default=0)
    player_data = Column(JSON)  # 玩家额外数据
    
    # 关联关系
    tournament = relationship("Tournament", back_populates="participants")


class VotingSession(Base):
    """投票环节表"""
    __tablename__ = "voting_sessions"
    
    id = Column(String, primary_key=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    stage_id = Column(String, ForeignKey("tournament_stages.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    voting_type = Column(String, nullable=False)  # single_choice, multiple_choice, ranking
    start_time = Column(TIMESTAMP)
    end_time = Column(TIMESTAMP)
    status = Column(String, default="pending")  # pending, active, finished
    allow_public_voting = Column(Boolean, default=True)
    max_votes_per_user = Column(Integer, default=1)
    voting_config = Column(JSON)
    
    # 关联关系
    stage = relationship("TournamentStage", back_populates="voting_sessions")
    options = relationship("VotingOption", back_populates="session")
    votes = relationship("Vote", back_populates="session")


class VotingOption(Base):
    """投票选项表"""
    __tablename__ = "voting_options"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("voting_sessions.id"))
    option_text = Column(String, nullable=False)
    description = Column(Text)
    option_order = Column(Integer)
    vote_count = Column(Integer, default=0)
    option_data = Column(JSON)  # 选项额外数据
    
    # 关联关系
    session = relationship("VotingSession", back_populates="options")
    votes = relationship("Vote", back_populates="option")


class Vote(Base):
    """投票记录表"""
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("voting_sessions.id"))
    option_id = Column(String, ForeignKey("voting_options.id"))
    voter_id = Column(String)  # 投票者ID（用户名或IP）
    voter_type = Column(String, default="user")  # user, participant, public
    vote_time = Column(TIMESTAMP, default=datetime.utcnow)
    vote_weight = Column(Float, default=1.0)  # 投票权重
    
    # 关联关系
    session = relationship("VotingSession", back_populates="votes")
    option = relationship("VotingOption", back_populates="votes")


# 保留原有的游戏数据表，但添加tournament关联
class GameEvent(Base):
    """游戏事件表"""
    __tablename__ = "tournament_game_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    match_id = Column(String, ForeignKey("tournament_matches.id"))
    event_type = Column(String, nullable=False)
    player = Column(String)
    target = Column(String)
    data = Column(JSON)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("TournamentMatch", back_populates="events")


class PlayerScore(Base):
    """玩家分数表"""
    __tablename__ = "tournament_player_scores"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    match_id = Column(String, ForeignKey("tournament_matches.id"))
    player_name = Column(String, nullable=False)
    score = Column(Integer, default=0)
    level = Column(Integer, default=1)
    health = Column(Integer, default=100)
    experience = Column(Integer, default=0)
    custom_stats = Column(JSON)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("TournamentMatch", back_populates="player_scores")


class MatchLeaderboard(Base):
    """比赛排行榜表"""
    __tablename__ = "tournament_match_leaderboard"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    match_id = Column(String, ForeignKey("tournament_matches.id"))
    player_name = Column(String, nullable=False)
    rank = Column(Integer, nullable=False)
    total_score = Column(Integer, default=0)
    team = Column(String)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("TournamentMatch", back_populates="leaderboard")


class TeamStat(Base):
    """团队统计表"""
    __tablename__ = "tournament_team_stats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    match_id = Column(String, ForeignKey("tournament_matches.id"))
    team_name = Column(String, nullable=False)
    total_score = Column(Integer, default=0)
    objectives = Column(Integer, default=0)
    progress = Column(Integer, default=0)
    custom_stats = Column(JSON)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("TournamentMatch", back_populates="team_stats")


class Comment(Base):
    """用户评论表"""
    __tablename__ = "tournament_comments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"))
    match_id = Column(String, ForeignKey("tournament_matches.id"))
    stage_id = Column(String, ForeignKey("tournament_stages.id"))
    username = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    comment_type = Column(String, default="chat")  # chat, reaction, announcement
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    match = relationship("TournamentMatch", back_populates="comments")