from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from db.base import Base

from models.user_model import User
from models.coffeshops_model import CoffeeShops


class Schedule(Base):
    __tablename__ = "schedule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    coffee_shop_id = Column(Integer, ForeignKey("coffeeshops.id"), index=True, nullable=True)
    status = Column(String, nullable=True)
    schedule_start_time = Column(DateTime, nullable=False)
    schedule_end_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    is_confirmed = Column(Boolean, nullable=True)    
