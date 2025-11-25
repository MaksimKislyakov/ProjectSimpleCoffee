from sqlalchemy import Column, Integer, String, ForeignKey

from db.base import Base

from models.user_model import User


class CoffeeShops(Base):
    """Модель кофейни в системе.
    
    Attributes:
        id: Уникальный идентификатор кофейни (autoincrement)
        manager_id: ID менеджера, ForeignKey к users.id
        adress: Физический адрес кофейни, обязательное поле
    """
    __tablename__ = "coffeeshops"

    id = Column(Integer, primary_key=True, autoincrement=True)
    manager_id = Column(Integer, ForeignKey("users.id"))
    adress = Column(String, nullable=False)