from sqlalchemy import Column, Integer, String, ForeignKey

from db.base import Base

from models.user_model import User


class CoffeeShops(Base):
    __tablename__ = "coffeeshops"

    id = Column(Integer, primary_key=True, autoincrement=True)
    manager_id = Column(Integer, ForeignKey("users.id"))
    adress = Column(String, nullable=False)