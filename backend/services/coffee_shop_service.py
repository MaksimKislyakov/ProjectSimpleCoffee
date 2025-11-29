from fastapi import HTTPException, status
from repositories.coffee_shop_repository import CoffeShopsRepository
from models.user_model import User
from models.roleEnum import RolesEnum


class CoffeeShopService:
    def __init__(self, coffee_shop_repo: CoffeShopsRepository):
        """Инициализация сервиса пользователей.
        
        Args:
            user_repo: Репозиторий для работы с пользователями
        """
        self.coffee_shop_repo = coffee_shop_repo

    async def get_coffee_shop_info(self, current_user: User):
        """Получает информацию о пользователе по ID.
        
        Args:
            user_id: ID пользователя для поиска
            
        Returns:
            User: Объект пользователя
            
        Raises:
            HTTPException: 404 если пользователь не найден
        """
        if current_user.role_id not in (RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail='Недостаточно прав')

        coffee_shop = await self.coffee_shop_repo.get_all()
    
        if not coffee_shop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Не найдено ни одной кофейни")

        return coffee_shop