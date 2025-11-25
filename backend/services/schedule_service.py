from fastapi import HTTPException, status
import logging
import datetime
from typing import List

from repositories.schedule_repository import ScheduleRepository
from repositories.coffee_shop_repository import CoffeShopsRepository

from models.user_model import User
from models.schedule_model import Schedule

from schemas.schedule_schemas import ScheduleCreate

from models.roleEnum import RolesEnum



logger = logging.getLogger(__name__)

class ScheduleService:
    def __init__(self, schedule_repo: ScheduleRepository):
        self.schedule_repo = schedule_repo

    def _normalize_datetime(self, dt: datetime.datetime) -> datetime.datetime:
        """Приводит datetime к offset-naive формату.
        
        Args:
            dt: datetime объект для нормализации
            
        Returns:
            datetime: Нормализованный datetime без временной зоны
        """
        if dt and dt.tzinfo is not None:
            return dt.replace(tzinfo=None)
        return dt

    def _validate_schedule_data_start_time_more_end_time(self, schedule_data: ScheduleCreate):
        """Валидирует что время начала смены раньше времени окончания.
        
        Args:
            schedule_data: Данные создаваемой смены
            
        Raises:
            HTTPException: 400 если время начала >= времени окончания
        """
        start_time = self._normalize_datetime(schedule_data.schedule_start_time)
        end_time = self._normalize_datetime(schedule_data.schedule_end_time)
        
        # Проверка, что дата начала раньше даты окончания
        if start_time >= end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Дата начала смены должна быть раньше даты окончания"
            )
        
    def _validate_schedule_time_max_and_min_time(self, schedule_data: ScheduleCreate):  
        """Валидирует продолжительность смены в допустимых пределах.
        
        Args:
            schedule_data: Данные создаваемой смены
            
        Raises:
            HTTPException: 400 если смена короче 1 часа или длиннее 12 часов
        """  
        start_time = self._normalize_datetime(schedule_data.schedule_start_time)
        end_time = self._normalize_datetime(schedule_data.schedule_end_time)
        
        min_duration = datetime.timedelta(hours=1)
        schedule_duration = end_time - start_time
        if schedule_duration < min_duration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Минимальная продолжительность смены - 1 час"
            )
        
        max_duration = datetime.timedelta(hours=12)
        if schedule_duration > max_duration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Максимальная продолжительность смены - 12 часов"
            )

    def _validate_schedule_no_time_conflicts(self, schedule_data: ScheduleCreate, all_schedules: List[Schedule]):        
        """Проверяет отсутствие пересечений с существующими сменами.
        
        Args:
            schedule_data: Данные создаваемой смены
            all_schedules: Список всех существующих смен
            
        Raises:
            HTTPException: 409 если найдено пересечение с существующей сменой
        """
        # Нормализуем даты новой смены
        new_start = self._normalize_datetime(schedule_data.schedule_start_time)
        new_end = self._normalize_datetime(schedule_data.schedule_end_time)
        
        for existing_schedule in all_schedules:
            # Проверяем только смены того же пользователя в той же кофейне
            if (existing_schedule.user_id == schedule_data.user_id and 
                existing_schedule.coffee_shop_id == schedule_data.coffee_shop_id):
                
                # Нормализуем даты существующей смены
                existing_start = self._normalize_datetime(existing_schedule.schedule_start_time)
                existing_end = self._normalize_datetime(existing_schedule.schedule_end_time)
                
                if self._check_time_overlap(new_start, new_end, existing_start, existing_end):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Смена пересекается с существующей сменой "
                              f"({existing_start.strftime('%d.%m.%Y %H:%M')} - "
                              f"{existing_end.strftime('%d.%m.%Y %H:%M')})"
                    )

    def _check_time_overlap(self, start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
        """Проверяет пересекаются ли два временных интервала.
        
        Args:
            start1: Начало первого интервала
            end1: Конец первого интервала
            start2: Начало второго интервала
            end2: Конец второго интервала
            
        Returns:
            bool: True если интервалы пересекаются, иначе False
        """
        
        # 1. Новая смена начинается внутри существующей
        if start1 >= start2 and start1 < end2:
            return True
        
        # 2. Новая смена заканчивается внутри существующей
        if end1 > start2 and end1 <= end2:
            return True
        
        # 3. Новая смена полностью содержит существующую
        if start1 <= start2 and end1 >= end2:
            return True
        
        # 4. Существующая смена полностью содержит новую
        if start1 >= start2 and end1 <= end2:
            return True
        
        return False
    
    def _normalize_time_marks(self, schedule_data):
        """Нормализует временные метки в данных смены.
        
        Args:
            schedule_data: Данные смены для нормализации
        """
        datetime_fields = ['schedule_start_time', 'schedule_end_time', 'actual_start_time', 'actual_end_time']
        for field in datetime_fields:
            if field in schedule_data and schedule_data[field]:
                schedule_data[field] = self._normalize_datetime(schedule_data[field])

    async def get_all_schedules(self, current_user: User):
        """Возвращает все смены из системы.
        
        Args:
            current_user: Текущий аутентифицированный пользователь
            
        Returns:
            List[Schedule]: Список всех смен
            
        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 404 если смены не найдены
        """
        if current_user.role_id not in (RolesEnum.barista, RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        all_schedules = await self.schedule_repo.get_all()

        if not all_schedules:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Расписание не найдено")

        return all_schedules
    
    async def create_new_item_schedule(self, data: ScheduleCreate, current_user: User):
        """Создает новую смену с комплексной валидацией.
        
        Args:
            data: Данные для создания смены
            current_user: Текущий аутентифицированный пользователь
            
        Returns:
            Schedule: Созданная смена
            
        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 400 если данные не прошли валидацию
            HTTPException: 409 если есть конфликт с существующими сменами
        """
        if current_user.role_id not in (RolesEnum.barista, RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Не достаточно прав")
        
        # валидация: старт !>= конец
        self._validate_schedule_data_start_time_more_end_time(data)
        # валидация максимального и минимального времени: 12 часов и 1 час
        self._validate_schedule_time_max_and_min_time(data)

        schedule_data = data.model_dump()

        # нормализация временных меток
        self._normalize_time_marks(schedule_data)
        
        all_schedules = await self.schedule_repo.get_all()

        # проверка пересечения временных интералов
        self._validate_schedule_no_time_conflicts(data, all_schedules)

        schedule = Schedule(**schedule_data)
        new_item_schedule = await self.schedule_repo.create_schedule(schedule)
        return new_item_schedule
        
    async def delete_item_schedule(self, id_schedule: int, current_user: User):
        """Удаляет смену по идентификатору.
        
        Args:
            id_schedule: ID смены для удаления
            current_user: Текущий аутентифицированный пользователь
            
        Returns:
            Schedule: Удаленная смена
            
        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 404 если смена не найдена
        """
        if current_user.role_id != RolesEnum.admin:
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        del_schedule = await self.schedule_repo.delete_schedule(id_schedule)

        if del_schedule is None:
            raise HTTPException(status_code=404, detail='Запись о рабочей смене не найдена')
        
        return del_schedule
    
    async def get_all_schedules_is_confirmed_false(self, current_user: User):
        """Возвращает все неподтвержденные смены.
        
        Args:
            current_user: Текущий аутентифицированный пользователь
            
        Returns:
            List[Schedule]: Список неподтвержденных смен
            
        Raises:
            HTTPException: 403 если недостаточно прав
            HTTPException: 204 если неподтвержденных смен нет
        """
        if current_user.role_id not in (RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        all_schedules_is_confirmed_false = await self.schedule_repo.get_all_is_confirmed_false()

        if all_schedules_is_confirmed_false is None:
            raise HTTPException(status_code=204, detail='Нет неподтвержденных смен')

        return all_schedules_is_confirmed_false
