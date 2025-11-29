from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime

from models.report_model import ReportModel

from repositories.schedule_repository import ScheduleRepository


class ReportRepository(ScheduleRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_total_adward_or_fine(self, report: ReportModel):
        """Добавление данных о премиях и штрафах"""
        self.session.add(report)

        await self.session.commit()
        await self.session.refresh(report)

        return report
    
    async def get_total_adwards_and_fine(self, user_id: int, start_date: datetime, end_date: datetime) -> List[ReportModel]:
        period_start = datetime.combine(start_date.date(), datetime.min.time())
        period_end = datetime.combine(end_date.date(), datetime.max.time())
        
        query = select(ReportModel).where(
            ReportModel.user_id == user_id,
            ReportModel.date_of_issue >= period_start,
            ReportModel.date_of_issue <= period_end
        )
        result = await self.session.execute(query)
        return result.scalars().all()