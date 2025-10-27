from fastapi import HTTPException, status
from core.security import verify_password, create_access_token

class AuthService:
    def __init__(self, user_repo):
        self.user_repo = user_repo

    async def authenticate(self, username: str, password: str):
        user = await self.user_repo.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = create_access_token({"sub": user.username})
        return {"access_token": token, "token_type": "bearer"}
