from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from db.base import Base

from models.user_model import User


class CoffeeShops(Base):
    """Модель кофейни в системе.

    Attributes:
        id: Уникальный идентификатор кофейни (autoincrement)
        manager_id: ID менеджера, ForeignKey к users.id
        adress: Физический адрес кофейни, обязательное поле
        created_at: Дата и время создания записи
        updated_at: Дата и время последнего обновления записи
    """

    __tablename__ = "coffeeshops"

    id = Column(Integer, primary_key=True, autoincrement=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    adress = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
