from sqlalchemy.future import select
from models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: int) -> User:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_phone(self, telephone: str) -> User:
        result = await self.session.execute(select(User).where(User.telephone == str(telephone)))
        return result.scalars().first()
    
    async def create_user(self, user) -> User:
        self.session.add(user)

        await self.session.commit()
        await self.session.refresh(user)

        return user
    
    async def get_all_users(self) -> List[User]:
        result = await self.session.execute(select(User))
        return result.scalars().all()
    
    async def delete_user(self, user_id: int) -> User:
        user = await self.session.get(User, user_id)
        if not user:
            return None
        
        await self.session.delete(user)
        await self.session.commit()

        return user
