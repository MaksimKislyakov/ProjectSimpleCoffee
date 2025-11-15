from fastapi import HTTPException, status

from repositories.schedule_repository import ScheduleRepository
from repositories.coffee_shop_repository import CoffeShopsRepository

from models.user_model import User
from models.schedule_model import Schedule

from schemas.schedule_schemas import ScheduleCreate

from services.roleEnum import Roles

import logging


logger = logging.getLogger(__name__)

class ScheduleService:
    def __init__(self, schedule_repo: ScheduleRepository):
        self.schedule_repo = schedule_repo

    async def get_all_schedules(self, current_user: User):
        if current_user.role_id >= Roles.barista:
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        all_schedules = await self.schedule_repo.get_all()

        if not all_schedules:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Расписание не найдено")

        return all_schedules
    
    async def create_new_item_schedule(self, data: ScheduleCreate, current_user: User):
        if current_user.role_id >= Roles.barista:
            raise HTTPException(status_code=403, detail="Не достаточно прав")
        
        schedule_data = data.model_dump()
        
        datetime_fields = ['schedule_start_time', 'schedule_end_time', 'actual_start_time', 'actual_end_time']
        for field in datetime_fields:
            if field in schedule_data and schedule_data[field] and schedule_data[field].tzinfo is not None:
                schedule_data[field] = schedule_data[field].replace(tzinfo=None)
        
        all_schedules = await self.schedule_repo.get_all()

        schedule = Schedule(**schedule_data)

        for existing_schedule in all_schedules:
            if (existing_schedule.schedule_start_time == schedule_data['schedule_start_time'] and
                existing_schedule.schedule_end_time == schedule_data['schedule_end_time'] and
                existing_schedule.coffee_shop_id == schedule_data['coffee_shop_id'] and
                existing_schedule.user_id == schedule_data['user_id']):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, 
                    detail="Запись о расписании уже существует" 
                )

        new_item_schedule = self.schedule_repo.create(schedule)
        return await new_item_schedule
        
    async def delete_item_schedule(self, id_schedule: int, current_user: User):
        if current_user.role_id != Roles.admin:
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        del_schedule = await self.schedule_repo.delete_schedule(id_schedule)

        if del_schedule is None:
            raise HTTPException(status_code=404, detail='Запись о рабочей смене не найдена')
        
        return del_schedule
    

