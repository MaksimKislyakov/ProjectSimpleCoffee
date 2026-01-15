from sqlalchemy.future import select
from sqlalchemy import update
from models.user_model import User
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from core.security import hash_password


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
        result = await self.session.execute(
            select(User).where(User.telephone == str(telephone))
        )
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

    async def get_users_for_coffeshop(self, coffee_shop_id: int) -> List[User]:
        result = await self.session.execute(
            select(User).where(User.coffee_shop_id == coffee_shop_id)
        )

        return result.scalars().all()
    
    async def update_user(self, user_id: int, update_data: dict[str, Any]) -> User:
        """Обновляет данные пользователя.

        Args:
            user_id: ID пользователя для обновления
            update_data: Словарь с данными для обновления

        Returns:
            User: Обновленный пользователь или None если не найден
        """
        # Проверяем существование пользователя
        user = await self.get_by_id(user_id)
        if not user:
            return None

        # Если передали пароль - хэшируем его
        if 'hashed_password' in update_data and update_data['hashed_password']:
            update_data['hashed_password'] = hash_password(update_data['hashed_password'])

        # Удаляем None значения, чтобы не перезаписывать существующие
        update_data = {k: v for k, v in update_data.items() if v is not None}

        # Если нечего обновлять - возвращаем пользователя как есть
        if not update_data:
            return user

        # Выполняем обновление
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(**update_data)
        )
        
        await self.session.execute(stmt)
        await self.session.commit()
        
        # Возвращаем обновленного пользователя
        return await self.get_by_id(user_id)
