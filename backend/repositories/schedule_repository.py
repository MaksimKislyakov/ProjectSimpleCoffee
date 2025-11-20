from sqlalchemy.future import select
from models.schedule_model import Schedule
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

class ScheduleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self):
        result = await self.session.execute(select(Schedule))
        return result.scalars().all()

    async def create(self, schedule: Schedule):
        self.session.add(schedule)
        await self.session.commit()
        await self.session.refresh(schedule)
        return schedule

    async def delete_schedule(self, schedule_id: int):
        schedule = await self.session.get(Schedule, schedule_id)

        if not schedule:
            return None
        
        await self.session.delete(schedule)
        await self.session.commit()

        return schedule
    
    async def get_all_is_confirmed_false(self):
        result = await self.session.execute(select(Schedule).where(Schedule.is_confirmed == False))
        return result.scalars().all()
    
    async def get_schedules_one_user(self, user_id: int) -> List[Schedule]:
        schedules_one_user = await self.session.execute(select(Schedule).where(Schedule.user_id == user_id))
        return schedules_one_user.scalars().all()


    