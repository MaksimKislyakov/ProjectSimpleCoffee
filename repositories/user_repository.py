from sqlalchemy.future import select
from models.user import User

class UserRepository:
    def __init__(self, session):
        self.session = session

    async def get_by_username(self, username: str):
        result = await self.session.execute(select(User).where(User.username == username))
        return result.scalars().first()
