from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# SQLite数据库连接配置
SQLALCHEMY_DATABASE_URL = "sqlite:///./tournament.db"

# 创建数据库引擎，禁用同线程检查以支持多线程访问
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Tournament(Base):
    """锦标赛主表 - 存储锦标赛基本信息"""
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # 锦标赛名称
    status = Column(String, default="setting")  # 当前状态：setting/gaming/voting/halfing
    current_game = Column(String)  # 当前进行的游戏
    current_round = Column(Integer, default=1)  # 当前轮次
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系映射
    teams = relationship("Team", back_populates="tournament")
    games = relationship("Game", back_populates="tournament")

class Team(Base):
    """队伍表 - 存储队伍基本信息和总积分"""
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, index=True)  # 队伍ID (RED, BLUE等)
    name = Column(String)  # 队伍显示名称
    total_score = Column(Float, default=0.0)  # 队伍总积分（加权后）
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    
    # 关系映射
    tournament = relationship("Tournament", back_populates="teams")
    game_participations = relationship("GameParticipation", back_populates="team")

class Player(Base):
    """玩家表 - 存储玩家基本信息和总积分"""
    __tablename__ = "players"
    
    id = Column(String, primary_key=True, index=True)  # 玩家ID/用户名
    name = Column(String)  # 玩家显示名称
    total_score = Column(Float, default=0.0)  # 玩家总积分（加权后）
    
    # 关系映射
    game_participations = relationship("GameParticipation", back_populates="player")

class Game(Base):
    """游戏表 - 存储单场游戏信息"""
    __tablename__ = "games"
    
    id = Column(String, primary_key=True, index=True)  # 游戏实例ID (如: bingo_speed_round1)
    name = Column(String)  # 游戏名称
    game_type = Column(String)  # 游戏类型 (bingo_speed, parkour_chase等)
    round_number = Column(Integer)  # 轮次数字
    multiplier = Column(Float, default=1.0)  # 积分权重倍数
    status = Column(String, default="pending")  # 游戏状态
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    
    # 关系映射
    tournament = relationship("Tournament", back_populates="games")
    events = relationship("GameEvent", back_populates="game")
    participations = relationship("GameParticipation", back_populates="game")

class GameParticipation(Base):
    """游戏参与表 - 记录玩家在特定游戏中的队伍归属和得分"""
    __tablename__ = "game_participations"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey("games.id"))  # 游戏ID
    player_id = Column(String, ForeignKey("players.id"))  # 玩家ID
    team_id = Column(String, ForeignKey("teams.id"))  # 在该游戏中所属队伍
    raw_score = Column(Float, default=0.0)  # 原始分数
    weighted_score = Column(Float, default=0.0)  # 加权后分数
    
    # 关系映射
    game = relationship("Game", back_populates="participations")
    player = relationship("Player", back_populates="game_participations")
    team = relationship("Team", back_populates="game_participations")

class GameEvent(Base):
    """游戏事件表 - 记录游戏过程中的所有事件"""
    __tablename__ = "game_events"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey("games.id"))  # 所属游戏
    player = Column(String)  # 事件相关玩家
    team = Column(String)  # 事件相关队伍
    event = Column(String)  # 事件类型
    lore = Column(String)  # 事件附加信息
    timestamp = Column(DateTime, default=datetime.utcnow)  # 事件时间戳
    
    # 关系映射
    game = relationship("Game", back_populates="events")

class Vote(Base):
    """投票表 - 存储游戏投票结果（如果需要的话）"""
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    game = Column(String)  # 被投票的游戏
    ticket = Column(Integer, default=0)  # 得票数
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    """初始化数据库，创建所有表"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """数据库会话生成器，用于依赖注入"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_session():
    """直接获取数据库会话，用于非依赖注入场景"""
    return SessionLocal()