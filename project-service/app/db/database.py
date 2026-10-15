import os
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# For asyncpg, your connection string must start with postgresql+asyncpg://
load_dotenv()
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/architecture_db"
)

# 1. Create the Async Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to True if you want to see raw SQL logs in your terminal
    future=True,
)

# 2. Create the Session Maker
async_session_maker = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


# 3. Create the Base class for your models
class Base(DeclarativeBase):
    pass


# 4. Dependency Injection function for FastAPI routes
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
