from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CoffeeShopBase(BaseModel):
    """Базовая схема кофейни"""
    adress: str = Field(..., min_length=3, max_length=255, description="Адрес кофейни")
    manager_id: Optional[int] = Field(None, description="ID менеджера кофейни")


class CoffeeShopCreate(CoffeeShopBase):
    """Схема для создания кофейни"""
    adress: str = Field(..., min_length=3, max_length=255, description="Адрес кофейни")
    manager_id: Optional[int] = Field(None, description="ID менеджера кофейни")


class CoffeeShopUpdate(BaseModel):
    """Схема для обновления кофейни"""
    adress: Optional[str] = Field(None, min_length=3, max_length=255, description="Адрес кофейни")
    manager_id: Optional[int] = Field(None, description="ID менеджера кофейни")


class CoffeeShopResponse(CoffeeShopBase):
    """Схема для ответа с информацией о кофейне"""
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CoffeeShopDeleteResponse(BaseModel):
    """Схема для ответа при удалении кофейни"""
    message: str
    id: int
    adress: str