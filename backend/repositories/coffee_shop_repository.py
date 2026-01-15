from sqlalchemy.future import select
from models.coffeshops_model import CoffeeShops
from sqlalchemy.ext.asyncio import AsyncSession


from sqlalchemy.future import select
from sqlalchemy import update, delete
from models.coffeshops_model import CoffeeShops
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import datetime


class CoffeShopsRepository:
    def __init__(self, session: AsyncSession):
        """Инициализация репозитория кофеен.

        Args:
            session: Асинхронная сессия для работы с БД
        """
        self.session = session

    async def get_all(self) -> List[CoffeeShops]:
        """Получает все кофейни из базы данных.

        Returns:
            List[CoffeeShops]: Список всех кофеен
        """
        result = await self.session.execute(select(CoffeeShops))
        return result.scalars().all()

    async def get_by_id(self, coffee_shop_id: int) -> Optional[CoffeeShops]:
        """Получает кофейню по ID.

        Args:
            coffee_shop_id: ID кофейни

        Returns:
            Optional[CoffeeShops]: Кофейня или None
        """
        result = await self.session.execute(
            select(CoffeeShops).where(CoffeeShops.id == coffee_shop_id)
        )
        return result.scalar_one_or_none()

    async def get_by_manager_id(self, manager_id: int) -> List[CoffeeShops]:
        """Получает кофейни по ID менеджера.

        Args:
            manager_id: ID менеджера

        Returns:
            List[CoffeeShops]: Список кофеен менеджера
        """
        result = await self.session.execute(
            select(CoffeeShops).where(CoffeeShops.manager_id == manager_id)
        )
        return result.scalars().all()

    async def create(self, adress: str, manager_id: Optional[int] = None) -> CoffeeShops:
        """Создает новую кофейню.

        Args:
            adress: Адрес кофейни
            manager_id: ID менеджера (опционально)

        Returns:
            CoffeeShops: Созданная кофейня
        """
        coffee_shop = CoffeeShops(
            adress=adress,
            manager_id=manager_id
        )
        self.session.add(coffee_shop)
        await self.session.commit()
        await self.session.refresh(coffee_shop)
        return coffee_shop

    async def update(self, coffee_shop_id: int, **kwargs) -> Optional[CoffeeShops]:
        """Обновляет данные кофейни.

        Args:
            coffee_shop_id: ID кофейни
            **kwargs: Поля для обновления

        Returns:
            Optional[CoffeeShops]: Обновленная кофейня или None
        """
        
        coffee_shop = await self.get_by_id(coffee_shop_id)
        if not coffee_shop:
            return None

        stmt = (
            update(CoffeeShops)
            .where(CoffeeShops.id == coffee_shop_id)
            .values(**kwargs)
            .execution_options(synchronize_session="fetch")
        )
        
        await self.session.execute(stmt)
        await self.session.commit()
        
        return await self.get_by_id(coffee_shop_id)

    async def delete(self, coffee_shop_id: int) -> bool:
        """Удаляет кофейню.

        Args:
            coffee_shop_id: ID кофейни

        Returns:
            bool: True если удалено успешно, False если кофейня не найдена
        """

        coffee_shop = await self.get_by_id(coffee_shop_id)
        if not coffee_shop:
            return False

        stmt = delete(CoffeeShops).where(CoffeeShops.id == coffee_shop_id)
        await self.session.execute(stmt)
        await self.session.commit()
        
        return True
