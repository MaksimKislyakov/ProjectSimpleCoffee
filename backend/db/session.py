from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from core.config import settings

async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True
)

async_session = sessionmaker(
    async_engine,
    expire_on_commit=False,
    class_=AsyncSession
)

async def get_async_session():
    async with async_session() as session:
        yield session
