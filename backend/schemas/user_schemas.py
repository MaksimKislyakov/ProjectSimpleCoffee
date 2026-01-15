from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional
from decimal import Decimal


class UserBase(BaseModel):
    first_name: str
    last_name: str
    patronymic: Optional[str] = None
    email: EmailStr
    telephone: str
    role_id: int
    coffee_shop_id: int
    hourly_rate: Decimal = None
    assessment_rate: Optional[int] = 0
    work_experience: Optional[int] = 0
    data_work_start: datetime = datetime.now()


class UserCreate(UserBase):
    hashed_password: str


class UserRead(UserBase):
    id: int

    model_config = {"from_attributes": True}


class UserDelete(BaseModel):
    id: int


class UserUpdate(BaseModel):
    """Схема для обновления данных пользователя"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    role_id: Optional[int] = None
    coffee_shop_id: Optional[int] = None
    hourly_rate: Optional[Decimal] = None
    assessment_rate: Optional[int] = None
    work_experience: Optional[int] = None
    data_work_start: Optional[datetime] = None
    hashed_password: Optional[str] = None  # Для смены пароля

    @field_validator('telephone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            # Простая валидация формата телефона
            phone_pattern = r'^\+?[1-9]\d{1,14}$'
            if not re.match(phone_pattern, v):
                raise ValueError('Неверный формат телефона')
        return v

    @field_validator('hourly_rate')
    @classmethod
    def validate_hourly_rate(cls, v):
        if v is not None and v < 0:
            raise ValueError('Почасовая ставка не может быть отрицательной')
        return v

    @field_validator('assessment_rate')
    @classmethod
    def validate_assessment_rate(cls, v):
        if v is not None and (v < 0 or v > 10):
            raise ValueError('Рейтинг должен быть от 0 до 10')
        return v

    @field_validator('work_experience')
    @classmethod
    def validate_work_experience(cls, v):
        if v is not None and v < 0:
            raise ValueError('Опыт работы не может быть отрицательным')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "first_name": "Иван",
                "last_name": "Иванов",
                "patronymic": "Иванович",
                "email": "ivanov@example.com",
                "telephone": "+79991234567",
                "role_id": 2,
                "coffee_shop_id": 1,
                "hourly_rate": 500.00,
                "assessment_rate": 8,
                "work_experience": 24
            }
        }
    }