from fastapi import APIRouter, Depends, Path, HTTPException, status

from services.coffee_shop_service import CoffeeShopService
from api.v1.dependencies import get_coffee_shop_service, get_current_user
from schemas.coffeeshops_schemas import (
    CoffeeShopCreate,
    CoffeeShopUpdate,
    CoffeeShopResponse,
    CoffeeShopDeleteResponse
)
from models.user_model import User
from models.roleEnum import RolesEnum


router = APIRouter(prefix="/api/v1/coffee_shop", tags=["coffee_shop"])


@router.get("/get_coffee_shops")
async def get_coffee_shops(
    coffee_shop_service: CoffeeShopService = Depends(get_coffee_shop_service),
    user: User = Depends(get_current_user),
):
    return await coffee_shop_service.get_coffee_shop_info(user)


@router.post(
    "/create",
    response_model=CoffeeShopResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создание новой кофейни",
    description="Создает новую кофейню. Доступно только для администраторов."
)
async def create_new_coffeeshop(
    coffee_shop_data: CoffeeShopCreate,
    coffee_shop_service: CoffeeShopService = Depends(get_coffee_shop_service),
    user: User = Depends(get_current_user),
):
    """
    Создание новой кофейни.
    
    - **adress**: Адрес кофейни (обязательное поле, 3-255 символов)
    - **manager_id**: ID менеджера кофейни (опционально)
    
    Требует прав администратора.
    """
    return await coffee_shop_service.create_coffee_shop(coffee_shop_data, user)


@router.put(
    "/update/{coffee_shop_id}",
    response_model=CoffeeShopResponse,
    summary="Обновление данных кофейни",
    description="Обновляет данные кофейни по ID. Администраторы могут обновлять любые кофейни, менеджеры - только свои."
)
async def update_coffeeshop(
    coffee_shop_id: int = Path(..., gt=0, description="ID кофейни для обновления"),
    update_data: CoffeeShopUpdate = None,
    coffee_shop_service: CoffeeShopService = Depends(get_coffee_shop_service),
    user: User = Depends(get_current_user),
):
    """
    Обновление данных кофейни.
    
    - **coffee_shop_id**: ID кофейни (положительное число)
    - **adress**: Новый адрес кофейни (опционально, 3-255 символов)
    - **manager_id**: Новый ID менеджера (опционально)
    
    Администраторы могут обновлять любые кофейни.
    Менеджеры могут обновлять только кофейни, привязанные к ним.
    """
    if update_data is None:
        update_data = CoffeeShopUpdate()
    
    return await coffee_shop_service.update_coffee_shop(
        coffee_shop_id, 
        update_data, 
        user
    )


@router.delete(
    "/delete/{coffee_shop_id}",
    response_model=CoffeeShopDeleteResponse,
    summary="Удаление кофейни",
    description="Удаляет кофейню по ID. Доступно только для администраторов."
)
async def delete_coffeeshop(
    coffee_shop_id: int = Path(..., gt=0, description="ID кофейни для удаления"),
    coffee_shop_service: CoffeeShopService = Depends(get_coffee_shop_service),
    user: User = Depends(get_current_user),
):
    """
    Удаление кофейни.
    
    - **coffee_shop_id**: ID кофейни (положительное число)
    
    Требует прав администратора.
    """
    return await coffee_shop_service.delete_coffee_shop(coffee_shop_id, user)


@router.get(
    "/{coffee_shop_id}",
    response_model=CoffeeShopResponse,
    summary="Получение кофейни по ID",
    description="Получает информацию о конкретной кофейне по её ID."
)
async def get_coffee_shop_by_id(
    coffee_shop_id: int = Path(..., gt=0, description="ID кофейни"),
    coffee_shop_service: CoffeeShopService = Depends(get_coffee_shop_service),
    user: User = Depends(get_current_user),
):
    """
    Получение информации о кофейне по ID.
    
    - **coffee_shop_id**: ID кофейни (положительное число)
    """
    # Для этого метода нужно добавить соответствующий метод в сервис
    # или использовать существующий функционал
    coffee_shop_repo = coffee_shop_service.coffee_shop_repo
    coffee_shop = await coffee_shop_repo.get_by_id(coffee_shop_id)
    
    if not coffee_shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Кофейня с ID {coffee_shop_id} не найдена"
        )
    
    # Проверка прав
    if user.role_id not in (RolesEnum.admin, RolesEnum.manager, RolesEnum.barista):
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Если пользователь менеджер, проверяем что кофейня его
    if user.role_id == RolesEnum.manager and coffee_shop.manager_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете просматривать только свои кофейни"
        )
    
    return CoffeeShopResponse.from_orm(coffee_shop)