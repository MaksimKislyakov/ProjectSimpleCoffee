from enum import IntEnum

class RolesEnum(IntEnum):
    """Перечисление ролей пользователей в системе.
    
    Attributes:
        admin: Администратор системы (высший уровень доступа)
        manager: Менеджер кофейни (средний уровень доступа) 
        barista: Бариста (базовый уровень доступа)
    """
    admin = 1
    manager = 2
    barista = 3