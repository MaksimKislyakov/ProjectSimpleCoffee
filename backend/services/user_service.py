from fastapi import HTTPException, status
from repositories.user_repository import UserRepository
from schemas.user_schemas import UserCreate
from models.user import User
from core.security import hash_password

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_info(self, user_id: int):
        user = await self.user_repo.get_by_id(user_id)
    
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return user
    
    async def create_new_user(self, data: UserCreate, current_user: User):
        if current_user.role_id == 3:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        user = User(**data.model_dump())

        new_user = await self.user_repo.create_user(user)

        return new_user