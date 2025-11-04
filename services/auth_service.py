from fastapi import HTTPException, status
from core.security import verify_password, create_access_token
from repositories.user_repository import UserRepository

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def authenticate(self, user_id: str, password: str):
        user = await self.user_repo.get_by_id(user_id)

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        token = create_access_token({"sub": user.user_id})
        return {"access_token": token, "token_type": "bearer"}
