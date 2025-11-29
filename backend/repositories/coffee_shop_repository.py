from sqlalchemy.future import select
from models.coffeshops_model import CoffeeShops
from sqlalchemy.ext.asyncio import AsyncSession

class CoffeShopsRepository:
    def __init__(self, session: AsyncSession):
        """Инициализация репозитория кофеен.
        
        Args:
            session: Асинхронная сессия для работы с БД
        """
        self.session = session

    async def get_all(self):
        """Получает все кофейни из базы данных.
        
        Returns:
            List[CoffeeShops]: Список всех кофеен
        """
        result = await self.session.execute(select(CoffeeShops))
        return result.scalars().all()