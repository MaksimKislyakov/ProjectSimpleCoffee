from sqlalchemy import Column, Integer, String, ForeignKey
from db.base import Base

class Roles(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_type = Column(String, index=True, nullable=False)
    permissoin = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    