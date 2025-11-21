from sqlalchemy import Column, Integer, String
from db.base import Base

class Roles(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_type = Column(String, index=True, nullable=False)
    permission = Column(Integer, nullable=False)
