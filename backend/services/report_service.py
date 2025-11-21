from fastapi import HTTPException, status
import logging
from typing import List, Tuple
from datetime import datetime

from repositories.schedule_repository import ScheduleRepository
from repositories.user_repository import UserRepository
from repositories.report_repository import ReportRepository

from models.user_model import User
from models.schedule_model import Schedule

from schemas.schedule_schemas import ScheduleCreate

from models.roleEnum import RolesEnum


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

class ReportService:
    def __init__(self, reports_repository: ReportRepository):
        self.reports_repo = reports_repository

    async def get_my_report_of_all_time(self, current_user: User):
        if current_user.role_id not in (RolesEnum.barista, RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        my_schedules = await self.reports_repo.get_schedules_one_user(current_user.id)
        dates = [
            [schedule.schedule_start_time, schedule.schedule_end_time, schedule.status] 
            for schedule in my_schedules
        ]
        
        total_hours, total_minutes = self._count_work_time(dates)
        work_days = self._count_shifts_day(dates)
        total_salary = self._count_total_salary(current_user.hourly_rate, total_hours)

        return {"work_hours": total_hours, 
                "work_days": work_days,
                "total_earnings": total_salary}

    def _count_work_time(self, dates: List[List[datetime]]) -> Tuple[int, int]:
        total_seconds = 0
        
        for start_time, end_time, _ in dates:
            if start_time and end_time and end_time > start_time:
                duration = end_time - start_time
                total_seconds += duration.total_seconds()
        
        total_minutes = int(total_seconds // 60)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        return hours, minutes
    
    def _count_shifts_day(self, dates: List[List[datetime]]) -> int:
        work_days = 0

        for _, _, status in dates:
            if status == "Рабочая смена":
                work_days += 1

        return work_days
    
    def _count_total_salary(self, hourly_rate: int, total_hours: int) -> float:
        total_salary = hourly_rate * total_hours
        return total_salary
        