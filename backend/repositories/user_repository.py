from sqlalchemy.future import select
from models.user_model import User
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List


class UserRepository:
    def __init__(self, session: AsyncSession):
        """Инициализация репозитория пользователей.
        
        Args:
            session: Асинхронная сессия для работы с БД
        """
        self.session = session

    async def get_by_id(self, user_id: int) -> User:
        """Получает пользователя по идентификатору.
        
        Args:
            user_id: ID пользователя для поиска
            
        Returns:
            User: Найденный пользователь или None
        """
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_phone(self, telephone: str) -> User:
        """Получает пользователя по номеру телефона.
        
        Args:
            telephone: Номер телефона для поиска
            
        Returns:
            User: Найденный пользователь или None
        """
        result = await self.session.execute(select(User).where(User.telephone == str(telephone)))
        return result.scalars().first()
    
    async def create_user(self, user) -> User:
        """Создает нового пользователя в базе данных.
        
        Args:
            user: Объект пользователя для создания
            
        Returns:
            User: Созданный пользователь
        """
        self.session.add(user)

        await self.session.commit()
        await self.session.refresh(user)

        return user
    
    async def get_all_users(self) -> List[User]:
        """Получает всех пользователей из базы данных.
        
        Returns:
            List[User]: Список всех пользователей
        """
        result = await self.session.execute(select(User))
        return result.scalars().all()
    
    async def delete_user(self, user_id: int) -> User:
        """Удаляет пользователя по идентификатору.
        
        Args:
            user_id: ID пользователя для удаления
            
        Returns:
            User: Удаленный пользователь или None если не найден
        """
        user = await self.session.get(User, user_id)
        if not user:
            return None
        
        await self.session.delete(user)
        await self.session.commit()

        return user
