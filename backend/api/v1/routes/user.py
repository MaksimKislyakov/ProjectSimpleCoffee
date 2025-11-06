from fastapi import APIRouter, Depends
from schemas.user import UserRead
from services.user_service import UserService
from models.user import User
from api.v1.dependencies import get_user_service, get_current_user

router = APIRouter(prefix="/api/v1/user", tags=["user"])

@router.get("/me", response_model=UserRead)
async def login(user_service: UserService = Depends(get_user_service), user: User = Depends(get_current_user)):
    return await user_service.get_user_info(user.id)