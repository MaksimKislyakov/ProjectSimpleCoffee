from pydantic import BaseModel, EmailStr
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
    hourly_rate: Decimal
    assessment_rate: Optional[int] = 0
    work_experience: Optional[int] = 0

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    user_id: int

    model_config = {"from_attributes": True}