from fastapi import HTTPException, status
from repositories.coffee_shop_repository import CoffeShopsRepository
from models.user_model import User
from models.coffeshops_model import CoffeeShops
from models.roleEnum import RolesEnum
from schemas.coffeeshops_schemas import (
    CoffeeShopCreate, 
    CoffeeShopUpdate, 
    CoffeeShopResponse,
    CoffeeShopDeleteResponse
)


class CoffeeShopService:
    def __init__(self, coffee_shop_repo: CoffeShopsRepository):
        """Инициализация сервиса кофеен.

        Args:
            coffee_shop_repo: Репозиторий для работы с кофейнями
        """
        self.coffee_shop_repo = coffee_shop_repo

    async def get_coffee_shop_info(self, current_user: User) -> list[CoffeeShops]:
        """Получает информацию о кофейнях.

        Args:
            current_user: Текущий пользователь

        Returns:
            List[CoffeeShops]: Список кофеен

        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 404 если кофейни не найдены
        """
        if current_user.role_id not in (RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        coffee_shops = await self.coffee_shop_repo.get_all()

        if not coffee_shops:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Не найдено ни одной кофейни",
            )

        return coffee_shops

    async def create_coffee_shop(
        self, 
        coffee_shop_data: CoffeeShopCreate, 
        current_user: User
    ) -> CoffeeShopResponse:
        """Создает новую кофейню.

        Args:
            coffee_shop_data: Данные для создания кофейни
            current_user: Текущий пользователь

        Returns:
            CoffeeShopResponse: Созданная кофейня

        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 400 если ошибка валидации
        """
        if current_user.role_id != RolesEnum.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только администратор может создавать кофейни"
            )

        try:
            coffee_shop = await self.coffee_shop_repo.create(
                adress=coffee_shop_data.adress,
                manager_id=coffee_shop_data.manager_id
            )
            
            return CoffeeShopResponse.from_orm(coffee_shop)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ошибка при создании кофейни: {str(e)}"
            )

    async def update_coffee_shop(
        self, 
        coffee_shop_id: int, 
        update_data: CoffeeShopUpdate, 
        current_user: User
    ) -> CoffeeShopResponse:
        """Обновляет данные кофейни.

        Args:
            coffee_shop_id: ID кофейни
            update_data: Данные для обновления
            current_user: Текущий пользователь

        Returns:
            CoffeeShopResponse: Обновленная кофейня

        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 404 если кофейня не найдена
        """
        if current_user.role_id != RolesEnum.admin:
            if current_user.role_id == RolesEnum.manager:
                manager_coffee_shops = await self.coffee_shop_repo.get_by_manager_id(
                    current_user.id
                )
                coffee_shop_ids = [cs.id for cs in manager_coffee_shops]
                
                if coffee_shop_id not in coffee_shop_ids:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Вы можете обновлять только свои кофейни"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Недостаточно прав для обновления кофейни"
                )

        existing_coffee_shop = await self.coffee_shop_repo.get_by_id(coffee_shop_id)
        if not existing_coffee_shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Кофейня с ID {coffee_shop_id} не найдена"
            )

        update_dict = update_data.dict(exclude_unset=True)
        
        if not update_dict:
            return CoffeeShopResponse.from_orm(existing_coffee_shop)

        try:
            updated_coffee_shop = await self.coffee_shop_repo.update(
                coffee_shop_id, 
                **update_dict
            )
            
            if not updated_coffee_shop:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Кофейня с ID {coffee_shop_id} не найдена"
                )
            
            return CoffeeShopResponse.from_orm(updated_coffee_shop)
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ошибка при обновлении кофейни: {str(e)}"
            )

    async def delete_coffee_shop(
        self, 
        coffee_shop_id: int, 
        current_user: User
    ) -> CoffeeShopDeleteResponse:
        """Удаляет кофейню.

        Args:
            coffee_shop_id: ID кофейни
            current_user: Текущий пользователь

        Returns:
            CoffeeShopDeleteResponse: Результат удаления

        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 404 если кофейня не найдена
        """
        if current_user.role_id != RolesEnum.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Только администратор может удалять кофейни"
            )

        existing_coffee_shop = await self.coffee_shop_repo.get_by_id(coffee_shop_id)
        if not existing_coffee_shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Кофейня с ID {coffee_shop_id} не найдена"
            )

        try:
            success = await self.coffee_shop_repo.delete(coffee_shop_id)
            
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Кофейня с ID {coffee_shop_id} не найдена"
                )
            
            return CoffeeShopDeleteResponse(
                message="Кофейня успешно удалена",
                id=coffee_shop_id,
                adress=existing_coffee_shop.adress
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ошибка при удалении кофейни: {str(e)}"
            )
