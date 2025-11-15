from sqlalchemy.future import select
from models.coffeshops_model import CoffeeShops
from sqlalchemy.ext.asyncio import AsyncSession

class CoffeShopsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self):
        result = await self.session.execute(select(CoffeeShops))
        return result.scalars().all()