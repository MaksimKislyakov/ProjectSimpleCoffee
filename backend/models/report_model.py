from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship

from db.base import Base

from models.user_model import User
from models.coffeshops_model import CoffeeShops


class ReportModel(Base):
    """Модель отчета о работе сотрудника.
    
    Attributes:
        id: Уникальный идентификатор отчета (autoincrement)
        user_id: ID пользователя, ForeignKey к users.id
        total_award: Сумма премий за период
        total_fine: Сумма штрафов за период
        date_of_issue: Дата назначения штрафа или премии
    """
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True, nullable=False)
    total_award = Column(Float, nullable=True)
    total_fine = Column(Float, nullable=True)
    date_of_issue = Column(DateTime, nullable=True)
    