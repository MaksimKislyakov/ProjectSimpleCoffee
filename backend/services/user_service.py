from fastapi import HTTPException, status
from core.security import verify_password, create_access_token
from repositories.user_repository import UserRepository

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_info(self, user_id: int):
        user = await self.user_repo.get_by_id(user_id)\
    
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return user