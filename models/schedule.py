from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.base import Base

class Schedule(Base):
    __tablename__ = "schedule"

    id = Column(Integer, primary_key=True)
    coffee_shop = Column(String, index=True)
    employee = Column(String)
    shift_start = Column(DateTime)
    shift_end = Column(DateTime)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", backref="schedules")
