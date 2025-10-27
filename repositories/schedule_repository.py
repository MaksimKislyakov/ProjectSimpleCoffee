from sqlalchemy.future import select
from models.schedule import Schedule

class ScheduleRepository:
    def __init__(self, session):
        self.session = session

    async def get_all(self):
        result = await self.session.execute(select(Schedule))
        return result.scalars().all()

    async def create(self, schedule: Schedule):
        self.session.add(schedule)
        await self.session.commit()
        await self.session.refresh(schedule)
        return schedule
