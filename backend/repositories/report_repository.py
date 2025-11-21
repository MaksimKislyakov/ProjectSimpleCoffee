from sqlalchemy.future import select
from models.schedule_model import Schedule
from models.user_model import User
from repositories.schedule_repository import ScheduleRepository
from sqlalchemy.ext.asyncio import AsyncSession

class ReportRepository(ScheduleRepository):
    def __init__(self, session: AsyncSession):
        self.session = session


