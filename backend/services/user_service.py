from fastapi import HTTPException, status
from repositories.user_repository import UserRepository
from schemas.user_schemas import UserCreate, UserRead, UserBase
from models.user_model import User
from core.security import hash_password
from services.roleEnum import Roles


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_info(self, user_id: int):
        user = await self.user_repo.get_by_id(user_id)
    
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return user
    
    async def create_new_user(self, user_data: UserCreate, current_user: User):
        if current_user.role_id != Roles.admin:
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
            data_work_start=user_data.data_work_start
        )

        new_user = await self.user_repo.create_user(user)

        return new_user
    
    async def get_all_users(self, current_user: User):
        if current_user.role_id >= Roles.barista:
            raise HTTPException(status_code=403, detail='Не достаточно прав')
        all_users = await self.user_repo.get_all_users()
        return all_users
    
    async def delete_user(self, id_user_del, current_user: User) -> User:
        if current_user.role_id != Roles.admin:
            raise HTTPException(status_code=403, detail='Не достаточно прав')
        
        del_user = await self.user_repo.delete_user(id_user_del)

        return del_user