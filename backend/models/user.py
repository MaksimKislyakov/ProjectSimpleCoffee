from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric
from db.base import Base
from datetime import datetime

from models.roles import Roles
# from models.coffeshops import CoffeeShops

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    patronymic = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    telephone = Column(String, unique=True, index=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    coffee_shop_id = Column(Integer, ForeignKey("coffeeshops.id"), nullable=True)
    hourly_rate = Column(Numeric(precision=6, scale=2), nullable=True)
    assessment_rate = Column(Integer, nullable=True, default=0)
    work_experience = Column(Integer, nullable=True, default=0)
    data_work_start = Column(DateTime, nullable=True, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"

