from fastapi import HTTPException, status
from repositories.user_repository import UserRepository
from schemas.user_schemas import UserCreate, UserUpdate
from models.user_model import User
from core.security import hash_password
from models.roleEnum import RolesEnum


class UserService:
    def __init__(self, user_repo: UserRepository):
        """Инициализация сервиса пользователей.

        Args:
            user_repo: Репозиторий для работы с пользователями
        """
        self.user_repo = user_repo

    async def get_user_info(self, user_id: int):
        """Получает информацию о пользователе по ID.

        Args:
            user_id: ID пользователя для поиска

        Returns:
            User: Объект пользователя

        Raises:
            HTTPException: 404 если пользователь не найден
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден"
            )

        return user

    async def create_new_user(self, user_data: UserCreate, current_user: User):
        """Создает нового пользователя в системе.

        Args:
            user_data: Данные для создания пользователя
            current_user: Текущий аутентифицированный пользователь

        Returns:
            User: Созданный пользователь

        Raises:
            HTTPException: 403 если недостаточно прав (только для admin)
        """
        if current_user.role_id != RolesEnum.admin:
            raise HTTPException(status_code=403, detail="Не достаточно прав")

        hashed_password = hash_password(user_data.hashed_password)

        user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            patronymic=user_data.patronymic,
            email=user_data.email,
            telephone=user_data.telephone,
            role_id=user_data.role_id,
            hourly_rate=user_data.hourly_rate,
            assessment_rate=user_data.assessment_rate,
            work_experience=user_data.work_experience,
            hashed_password=hashed_password,
            coffee_shop_id=user_data.coffee_shop_id,
            data_work_start=user_data.data_work_start,
        )

        new_user = await self.user_repo.create_user(user)

        return new_user

    async def get_all_users(self, current_user: User):
        """Получает список всех пользователей системы.

        Args:
            current_user: Текущий аутентифицированный пользователь

        Returns:
            List[User]: Список всех пользователей

        Raises:
            HTTPException: 404 если пользователи не найдены
        """
        all_users = await self.user_repo.get_all_users()

        if all_users is None:
            raise HTTPException(
                status_code=404, detail="Не найдено ни одного пользователя"
            )

        return all_users

    async def delete_user(self, id_user_del, current_user: User) -> User:
        """Удаляет пользователя по ID.

        Args:
            id_user_del: ID пользователя для удаления
            current_user: Текущий аутентифицированный пользователь

        Returns:
            User: Удаленный пользователь

        Raises:
            HTTPException: 403 если недостаточно прав (только для admin)
            HTTPException: 404 если пользователь не найден
        """
        if current_user.role_id != RolesEnum.admin:
            raise HTTPException(status_code=403, detail="Не достаточно прав")

        del_user = await self.user_repo.delete_user(id_user_del)

        if del_user is None:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        return del_user

    async def get_all_users_for_coffeshop(
        self, coffee_shop_id: int, current_user: User
    ):
        if current_user.role_id not in (RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Не достаточно прав")

        users = await self.user_repo.get_users_for_coffeshop(coffee_shop_id)

        return users

    async def update_user(
        self, 
        user_id: int, 
        update_data: UserUpdate, 
        current_user: User
    ):
        """Обновляет данные пользователя.

        Args:
            user_id: ID пользователя для обновления
            update_data: Данные для обновления
            current_user: Текущий аутентифицированный пользователь

        Returns:
            User: Обновленный пользователь

        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 404 если пользователь не найден
            HTTPException: 400 если ошибка валидации
        """
        # Проверяем существование пользователя
        existing_user = await self.user_repo.get_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Пользователь с ID {user_id} не найден"
            )

        # Проверка прав доступа
        await self._check_update_permissions(user_id, existing_user, current_user)

        # Подготавливаем данные для обновления
        update_dict = update_data.dict(exclude_unset=True, exclude_none=True)
        
        # Удаляем поле hashed_password если оно пустое
        if 'hashed_password' in update_dict and not update_dict['hashed_password']:
            del update_dict['hashed_password']

        # Проверяем уникальность email если он обновляется
        if 'email' in update_dict:
            existing_email_user = await self.user_repo.get_by_email(update_dict['email'])
            if existing_email_user and existing_email_user.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с таким email уже существует"
                )

        # Проверяем уникальность телефона если он обновляется
        if 'telephone' in update_dict:
            existing_phone_user = await self.user_repo.get_by_phone(update_dict['telephone'])
            if existing_phone_user and existing_phone_user.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пользователь с таким телефоном уже существует"
                )

        # Проверяем права на изменение роли
        if 'role_id' in update_dict:
            if current_user.role_id != RolesEnum.admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Только администратор может изменять роль пользователя"
                )

        # Проверяем права на изменение кофейни
        if 'coffee_shop_id' in update_dict:
            if current_user.role_id not in (RolesEnum.admin, RolesEnum.manager):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Только администратор или менеджер может изменять привязку к кофейне"
                )

        # Обновляем пользователя
        updated_user = await self.user_repo.update_user(user_id, update_dict)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Пользователь с ID {user_id} не найден после обновления"
            )

        return updated_user

    async def _check_update_permissions(
        self, 
        user_id: int, 
        target_user: User, 
        current_user: User
    ):
        """Проверяет права на обновление пользователя.

        Args:
            user_id: ID пользователя для обновления
            target_user: Целевой пользователь
            current_user: Текущий пользователь

        Raises:
            HTTPException: 403 если недостаточно прав
        """
        # Администратор может обновлять любого пользователя
        if current_user.role_id == RolesEnum.admin:
            return

        # Менеджер может обновлять только пользователей своей кофейни
        if current_user.role_id == RolesEnum.manager:
            if target_user.coffee_shop_id != current_user.coffee_shop_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Вы можете обновлять только пользователей своей кофейни"
                )
            return

        # Пользователь может обновлять только себя
        if current_user.role_id not in (RolesEnum.admin, RolesEnum.manager):
            if current_user.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Вы можете обновлять только свои данные"
                )