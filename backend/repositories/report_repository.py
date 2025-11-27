from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

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
    
    async def get_total_adwards_and_fine(self, user_id: int) -> List[ReportModel]:
        result = await self.session.execute(select(ReportModel).where(ReportModel.user_id == user_id))

        return result.scalars().all()
    