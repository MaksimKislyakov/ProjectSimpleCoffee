from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship

from db.base import Base

from models.user_model import User
from models.coffeshops_model import CoffeeShops


class ReportModel:
    """Модель отчета о работе сотрудника.
    
    Attributes:
        id: Уникальный идентификатор отчета (autoincrement)
        user_id: ID пользователя, ForeignKey к users.id
        work_hours: Общее количество отработанных часов
        cnt_schedule: Количество отработанных смен  
        is_earning: Общий заработок за период
        is_award: Сумма премий за период
        is_fine: Сумма штрафов за период
    """
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True, nullable=False)
    work_hours = Column(Integer, nullable=False)
    cnt_schedule = Column(Integer, nullable=False)
    total_earning = Column(Float, nullable=False)
    total_award = Column(Float, nullable=False)
    total_fine = Column(Float, nullable=False)
    