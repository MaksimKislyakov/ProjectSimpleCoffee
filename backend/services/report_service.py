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

from services.calculate_service import CalculateServices


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
        
        total_hours, total_minutes = CalculateServices._count_work_time(dates)
        work_days = CalculateServices._count_shifts_day(dates)
        total_salary = CalculateServices._count_total_salary(current_user.hourly_rate, total_hours)

        return {"work_hours": total_hours, 
                "work_days": work_days,
                "total_earnings": total_salary}
