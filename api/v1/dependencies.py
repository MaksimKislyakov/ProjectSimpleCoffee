# api/v1/dependencies.py
from fastapi import Depends
from db.session import async_session
from repositories.schedule_repository import ScheduleRepository
from repositories.user_repository import UserRepository
from services.auth_service import AuthService
from sqlalchemy.ext.asyncio import AsyncSession

async def get_async_session() :
    async with async_session() as session:
        yield session

async def get_user_repository(session: AsyncSession = Depends(get_async_session)):
    return UserRepository(session)

async def get_schedule_repository(session: AsyncSession = Depends(get_async_session)):
    return ScheduleRepository(session)

async def get_auth_service(repo: UserRepository = Depends(get_user_repository)):
    return AuthService(repo)
