from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from db.base import Base

from models.user_model import User
from models.coffeshops_model import CoffeeShops


class Schedule(Base):
    """Модель рабочей смены сотрудника.
    
    Attributes:
        id: Уникальный идентификатор смены (autoincrement)
        user_id: ID пользователя, ForeignKey к users.id
        coffee_shop_id: ID кофейни, ForeignKey к coffeeshops.id
        status: Статус смены ("рабочая смена", "выходной", "больничный")
        schedule_start_time: Запланированное время начала смены
        schedule_end_time: Запланированное время окончания смены
        actual_start_time: Фактическое время начала смены
        actual_end_time: Фактическое время окончания смены
        is_confirmed: Флаг подтверждения смены
    """
    __tablename__ = "schedule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    coffee_shop_id = Column(Integer, ForeignKey("coffeeshops.id"), index=True, nullable=False)
    status = Column(String, nullable=True)
    schedule_start_time = Column(DateTime, nullable=False)
    schedule_end_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    is_confirmed = Column(Boolean, nullable=True)    
