from sqlalchemy.future import select
from models.user import User

class UserRepository:
    def __init__(self, session):
        self.session = session

    async def get_by_id(self, user_id: int) -> User:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_phone(self, telephone: str) -> User:
        result = await self.session.execute(select(User).where(User.telephone == str(telephone)))
        return result.scalars().first()
    