from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.auth import LoginRequest, TokenResponse
from core.security import verify_password, create_access_token
from models.user import User
from sqlalchemy.future import select
from typing import AsyncGenerator

router = APIRouter(prefix="/auth")

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    from db.session import async_session
    async with async_session() as session:
        yield session

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
