from fastapi import APIRouter, Depends
from schemas.user_schemas import UserRead, UserCreate, UserBase
from services.user_service import UserService
from models.user import User
from api.v1.dependencies import get_user_service, get_current_user
from typing import List

router = APIRouter(prefix="/api/v1/user", tags=["user"])

@router.get("/me", response_model=UserRead)
async def login(user_service: UserService = Depends(get_user_service), 
                user: User = Depends(get_current_user)):
    return await user_service.get_user_info(user.id)

@router.post("/create", response_model=UserCreate)
async def create(user_data: UserCreate,
                 user_service: UserService = Depends(get_user_service), 
                 user: User = Depends(get_current_user)):
    return await user_service.create_new_user(user_data, user)

@router.get("/all_users", response_model=List[UserRead])
async def get_users(user_service: UserService = Depends(get_user_service),
                    user: User = Depends(get_current_user)):
    return await user_service.get_all_users(user)