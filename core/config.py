from typing import ClassVar
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost/simplecoffee"
    SECRET_KEY: str = "your_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SYNC_DATABASE_URL: ClassVar[str] = DATABASE_URL.replace("asyncpg", "psycopg2")

settings = Settings()
