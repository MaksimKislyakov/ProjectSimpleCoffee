from fastapi import APIRouter, Depends, Path
from schemas.user_schemas import UserRead, UserCreate, UserUpdate
from services.user_service import UserService
from models.user_model import User
from api.v1.dependencies import get_user_service, get_current_user
from typing import List

router = APIRouter(prefix="/api/v1/user")


@router.get("/me", response_model=UserRead, tags=["user"])
async def login(
    user_service: UserService = Depends(get_user_service),
    user: User = Depends(get_current_user),
):
    return await user_service.get_user_info(user.id)


@router.post("/create", response_model=UserCreate, tags=["admin"])
async def create(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service),
    user: User = Depends(get_current_user),
):
    return await user_service.create_new_user(user_data, user)


@router.get("/all_users", response_model=List[UserRead], tags=["admin"])
async def get_users(
    user_service: UserService = Depends(get_user_service),
    user: User = Depends(get_current_user),
):
    return await user_service.get_all_users(user)


@router.delete("/delete_user/{user_id}", response_model=UserCreate, tags=["admin"])
async def delete_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
    user: User = Depends(get_current_user),
):
    return await user_service.delete_user(id_user_del=user_id, current_user=user)


@router.get("/get_users_for_coffeshop/{coffee_shop_id}", tags=["admin"])
async def get_users_for_coffeshop(
    coffee_shop_id: int,
    user_service: UserService = Depends(get_user_service),
    user: User = Depends(get_current_user),
):
    return await user_service.get_all_users_for_coffeshop(coffee_shop_id, user)

@router.patch(
    "/update/{user_id}",
    response_model=UserRead,
    summary="Обновление данных пользователя",
    description="""Обновление данных пользователя. 
    Доступно для:
    - Администратора: может обновлять любых пользователей
    - Менеджера: может обновлять только пользователей своей кофейни
    - Обычного пользователя: может обновлять только свои данные""",
    tags=["user", "admin", "manager"]
)
async def update_user(
    user_id: int = Path(..., description="ID пользователя для обновления", gt=0),
    update_data: UserUpdate = None,
    user_service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    """
    Обновление данных пользователя.
    
    Параметры:
    - **user_id**: ID пользователя для обновления
    - **update_data**: JSON с полями для обновления
    
    Права доступа:
    - Администратор: может обновлять любых пользователей
    - Менеджер: может обновлять только пользователей своей кофейни
    - Обычный пользователь: может обновлять только свои данные
    """
    if update_data is None:
        update_data = UserUpdate()
    
    return await user_service.update_user(user_id, update_data, current_user)