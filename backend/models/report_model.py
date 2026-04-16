from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship

from db.base import Base

from models.user_model import User
from models.coffeshops_model import CoffeeShops


class ReportModel:
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True, nullable=False)
    work_hours = Column(Integer, nullable=False)
    cnt_schedule = Column(Integer, nullable=False)
    is_earning = Column(Float, nullable=False)
    is_award = Column(Float, nullable=False)
    is_fine = Column(Float, nullable=False)
    