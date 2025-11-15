from pydantic import BaseModel, EmailStr
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