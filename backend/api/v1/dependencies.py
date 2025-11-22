from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordBearer

from db.session import async_session

from repositories.schedule_repository import ScheduleRepository
from repositories.user_repository import UserRepository
from repositories.report_repository import ReportRepository

from services.auth_service import AuthService
from services.user_service import UserService
from services.schedule_service import ScheduleService
from services.report_service import ReportService

from core.config import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_async_session() :
    async with async_session() as session:
        yield session

async def get_user_repository(session: AsyncSession = Depends(get_async_session)) -> UserRepository:
    return UserRepository(session)

async def get_schedule_repository(session: AsyncSession = Depends(get_async_session)) -> ScheduleRepository:
    return ScheduleRepository(session)

async def get_report_repository(session: AsyncSession = Depends(get_async_session)) -> ReportRepository:
    return ReportRepository(session)

async def get_auth_service(repo: UserRepository = Depends(get_user_repository)) -> AuthService:
    return AuthService(repo)

async def get_user_service(repo: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(repo)

async def get_schedule_service(repo: ScheduleRepository = Depends(get_schedule_repository)) -> ScheduleService:
    return ScheduleService(repo)
    
async def get_report_service(repo_report: ReportRepository = Depends(get_report_repository)) -> ScheduleService:
    return ReportService(repo_report)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Проверяет Bearer-токен, декодирует JWT и возвращает текущего пользователя."""
    print("TOKEN RECEIVED:", token)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}, 
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_sub": False}
        )

        user_id: str = payload.get("sub")
        if user_id is None:
            print("User ID not found in token payload")
            raise credentials_exception

    except JWTError:
        print("JWTError occurred during token decoding")
        raise credentials_exception

    async with async_session() as session:
        repo = UserRepository(session)
        user = await repo.get_by_id(user_id)

        if user is None:
            raise credentials_exception

        return user