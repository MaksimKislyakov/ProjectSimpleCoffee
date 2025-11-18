from fastapi import APIRouter, Depends
from schemas.user_schemas import UserRead, UserCreate, UserDelete
from services.user_service import UserService
from models.user_model import User
from api.v1.dependencies import get_user_service, get_current_user
from typing import List

router = APIRouter(prefix="/api/v1/user")

@router.get("/me", response_model=UserRead, tags=['user'])
async def login(user_service: UserService = Depends(get_user_service), 
                user: User = Depends(get_current_user)):
    return await user_service.get_user_info(user.id)

@router.post("/create", response_model=UserCreate, tags=['admin'])
async def create(user_data: UserCreate,
                 user_service: UserService = Depends(get_user_service), 
                 user: User = Depends(get_current_user)):
    return await user_service.create_new_user(user_data, user)

@router.get("/all_users", response_model=List[UserRead], tags=['admin'])
async def get_users(user_service: UserService = Depends(get_user_service),
                    user: User = Depends(get_current_user)):
    return await user_service.get_all_users(user)

@router.delete("/delete_user", response_model=UserCreate, tags=['admin'])
async def delete_user(user_del: UserDelete,
                      user_service: UserService = Depends(get_user_service),
                      user: User = Depends(get_current_user)):
    return await user_service.delete_user(id_user_del=user_del.id, current_user=user)