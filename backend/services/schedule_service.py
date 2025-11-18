from fastapi import HTTPException, status
from repositories.schedule_repository import ScheduleRepository

from models.user import User
from models.schedule import Schedule

from schemas.schedule_schemas import ScheduleCreate, ScheduleRead

class ScheduleService:
    def __init__(self, schedule_repo: ScheduleRepository):
        self.schedule_repo = schedule_repo

    async def get_all_schedules(self, current_user: User):
        if current_user.role_id != 1:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        all_schedules = await self.schedule_repo.get_all()

        if not all_schedules:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedules not found")

        return all_schedules
    
    async def create_new_item_schedule(self, data: ScheduleCreate, current_user: User):
        if current_user.role_id == 3:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        schedule = Schedule(**data.model_dump())

        new_item_schedule = self.schedule_repo.create(schedule)
        return await new_item_schedule
        

