from sqlalchemy.future import select
from models.schedule_model import Schedule
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime
from fastapi import HTTPException


class ScheduleRepository:
    def __init__(self, session: AsyncSession):
        """Инициализация репозитория расписания.
        
        Args:
            session: Асинхронная сессия для работы с БД
        """
        self.session = session

    async def get_all(self):
        """Получает все смены из базы данных.
        
        Returns:
            List[Schedule]: Список всех смен
        """
        result = await self.session.execute(select(Schedule))
        return result.scalars().all()

    async def create_schedule(self, schedule: Schedule):
        """Создает новую смену в базе данных.
        
        Args:
            schedule: Объект смены для создания
            
        Returns:
            Schedule: Созданная смена
        """
        self.session.add(schedule)
        await self.session.commit()
        await self.session.refresh(schedule)
        return schedule

    async def delete_schedule(self, schedule_id: int):
        """Удаляет смену по идентификатору.
        
        Args:
            schedule_id: ID смены для удаления
            
        Returns:
            Schedule: Удаленная смена или None если не найдена
        """
        schedule = await self.session.get(Schedule, schedule_id)

        if not schedule:
            return None
        
        await self.session.delete(schedule)
        await self.session.commit()

        return schedule
    
    async def get_all_is_confirmed_false(self):
        """Получает все неподтвержденные смены.
        
        Returns:
            List[Schedule]: Список неподтвержденных смен
        """
        result = await self.session.execute(select(Schedule).where(Schedule.is_confirmed == False))
        return result.scalars().all()
    
    async def get_schedules_one_user(self, user_id: int) -> List[Schedule]:
        """Получает все смены конкретного пользователя.
        
        Args:
            user_id: ID пользователя
            
        Returns:
            List[Schedule]: Список смен пользователя
        """
        schedules_one_user = await self.session.execute(select(Schedule).where(Schedule.user_id == user_id))
        return schedules_one_user.scalars().all()
    
    async def update_schedule_actual_time(self, schedule_id: int, actual_start_time: datetime = None, actual_end_time: datetime = None):
        """Обновляет фактическое время начала и/или окончания смены.
        
        Args:
            schedule_id: ID смены для обновления
            actual_start_time: Фактическое время начала смены
            actual_end_time: Фактическое время окончания смены
            
        Returns:
            Schedule: Обновленная смена
            
        Raises:
            ValueError: Если смена не найдена
        """
        schedule = await self.session.get(Schedule, schedule_id)
        if not schedule:
            raise HTTPException(status_code=403, detail='Нет записи о смене')
        
        if actual_start_time is not None:
            schedule.actual_start_time = actual_start_time
            
        if actual_end_time is not None:
            schedule.actual_end_time = actual_end_time
        
        await self.session.commit()
        await self.session.refresh(schedule)
        
        return schedule

    async def update_schedule_is_confirmed(self, schedule_id: int, is_confirmed: bool):
        """Обновляет статус подтверждения смены."""
        schedule = await self.session.get(Schedule, schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail='Смена не найдена')
        print(schedule_id, schedule)
        schedule.is_confirmed = is_confirmed
        await self.session.commit()
        await self.session.refresh(schedule)
        return schedule
    