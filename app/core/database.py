"""
数据库配置模块

功能:
- SQLite数据库连接配置
- 异步数据库会话管理
- 自动创建数据库表结构

使用SQLite的优势:
- 无需额外安装数据库服务
- 文件数据库，便于部署和备份
- 支持并发读取
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# SQLite数据库配置
DATABASE_FILE = os.getenv("DATABASE_FILE", "mc_live.db")
DATABASE_URL = f"sqlite+aiosqlite:///./{DATABASE_FILE}"

# 创建异步引擎
engine = create_async_engine(
    DATABASE_URL, 
    echo=False,  # 生产环境建议设为False
    future=True,
    # SQLite特定配置
    connect_args={"check_same_thread": False}
)

# 创建异步会话工厂
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# 声明式基类
Base = declarative_base()


async def init_db(use_tournament_models=False):
    """
    初始化数据库表结构
    如果表不存在会自动创建
    """
    print("📁 初始化SQLite数据库...")
    
    if use_tournament_models:
        # 使用新的锦标赛模型
        from app.models import tournament_models
        print("🏆 使用锦标赛数据模型")
    else:
        # 使用原有的简单模型
        from app.models import models
        print("🎮 使用简单比赛数据模型")
    
    async with engine.begin() as conn:
        # 创建所有表
        await conn.run_sync(Base.metadata.create_all)
    print(f"✅ 数据库初始化完成: {DATABASE_FILE}")


async def get_db():
    """
    获取数据库会话依赖注入
    用于FastAPI路由中获取数据库连接
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()