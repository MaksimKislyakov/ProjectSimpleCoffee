from sqlalchemy.future import select
from models.user import User

class UserRepository:
    def __init__(self, session):
        self.session = session

    async def get_by_id(self, user_id: str) -> User:
        result = await self.session.execute(select(User).where(User.user_id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> User:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalars().first()
    