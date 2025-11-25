from sqlalchemy import Column, Integer, String
from db.base import Base

class Roles(Base):
    """Модель ролей пользователей в системе.
    
    Attributes:
        id: Уникальный идентификатор роли (autoincrement)
        role_type: Название типа роли
        permission: Уровень прав доступа роли (числовой)
    """
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_type = Column(String, index=True, nullable=False)
    permission = Column(Integer, nullable=False)
