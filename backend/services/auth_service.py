from fastapi import HTTPException, status
from core.security import verify_password, create_access_token
from repositories.user_repository import UserRepository

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def authenticate(self, telephone: str, password: str):
        """Аутентифицирует пользователя и возвращает JWT-токен.
        
        Args:
            telephone: Номер телефона пользователя
            password: Пароль пользователя в открытом виде
            
        Returns:
            Словарь с ключами:
                access_token (str): JWT токен для авторизации
                token_type (str): Тип токена (bearer)
                
        Raises:
            HTTPException: Если телефон или пароль неверны
        """


        user = await self.user_repo.get_by_phone(telephone)

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        token = create_access_token({"sub": user.id})
        return {"access_token": token, "token_type": "bearer"}
