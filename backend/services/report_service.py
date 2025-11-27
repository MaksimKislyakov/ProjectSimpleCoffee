from fastapi import HTTPException, status
import logging
from typing import List, Tuple
from datetime import datetime

from repositories.schedule_repository import ScheduleRepository
from repositories.user_repository import UserRepository
from repositories.report_repository import ReportRepository

from models.user_model import User
from models.report_model import ReportModel

from schemas.report_schemas import ReportSchema, CreateReport

from models.roleEnum import RolesEnum

from services.calculate_service import CalculateServices


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

class ReportService:
    def __init__(self, reports_repository: ReportRepository):
        """Инициализация сервиса отчетов.
        
        Args:
            reports_repository: Репозиторий для работы с отчетами
        """
        self.reports_repo = reports_repository

    def _get_total_award_and_fine(self, user_id: int):        
        award_and_fine = self.reports_repo.get_total_adwards_and_fine(user_id)

        return award_and_fine

    async def get_my_report_of_all_time(self, current_user: User, start_date: datetime, end_date: datetime):
        """Генерирует отчет о работе за указанный период для текущего пользователя.
        
        Args:
            current_user: Текущий аутентифицированный пользователь
            start_date: Начальная дата периода (без времени)
            end_date: Конечная дата периода (без времени)
            
        Returns:
            dict: Отчет с данными о работе содержащий:
                - work_hours (int): Общее количество отработанных часов
                - work_days (int): Количество рабочих дней  
                - total_earnings (float): Общий заработок
                - total_award (float): Сумма премий
                - total_fine (float): Сумма штрафов
                - user_id (int): ID пользователя
                
        Raises:
            HTTPException: 403 если недостаточно прав
        """
        if current_user.role_id not in (RolesEnum.barista, RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        # Получаем смены за период
        my_schedules = await self.reports_repo.get_schedules_one_user(current_user.id)
        
        # Фильтруем смены по периоду
        filtered_schedules = []
        for schedule in my_schedules:
            # Проверяем, попадает ли смена в запрошенный период
            # Смена учитывается если schedule_start_time попадает в период [start_date, end_date]
            schedule_date = schedule.schedule_start_time.date()
            if start_date.date() <= schedule_date <= end_date.date():
                filtered_schedules.append(schedule)
        
        dates = [
            [schedule.schedule_start_time, schedule.schedule_end_time, schedule.status] 
            for schedule in filtered_schedules
        ]
        
        total_hours, total_minutes = CalculateServices._count_work_time(dates)
        work_days = CalculateServices._count_shifts_day(dates)
        total_salary = CalculateServices._count_total_salary(current_user.hourly_rate, total_hours)

        # Получаем премии и штрафы за период
        total_award_and_fine = await self.reports_repo.get_total_adwards_and_fine(current_user.id)
        
        # Фильтруем премии и штрафы по дате
        filtered_awards_and_fines = []
        for aw_and_fn in total_award_and_fine:
            if aw_and_fn.date_of_issue:
                # Проверяем, попадает ли дата назначения в период
                issue_date = aw_and_fn.date_of_issue.date()
                if start_date.date() <= issue_date <= end_date.date():
                    filtered_awards_and_fines.append(aw_and_fn)
        
        data_total_award_and_fine = [
            [aw_and_fn.total_award, aw_and_fn.total_fine]
            for aw_and_fn in filtered_awards_and_fines
        ]
        
        total_award, total_fine = CalculateServices._count_total_award_and_fine(data_total_award_and_fine)

        return {
            "work_hours": total_hours, 
            "work_days": work_days,
            "total_earnings": total_salary,
            "total_award": total_award,
            "total_fine": total_fine,
            "user_id": current_user.id
        }
    
    async def create_total_award_or_fine(self, data: CreateReport, current_user):
        if current_user.role_id not in (RolesEnum.barista, RolesEnum.admin, RolesEnum.manager):
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        report_award_and_fine = ReportModel(
            user_id = data.user_id,
            total_award = data.total_award,
            total_fine = data.total_fine,
            date_of_issue = datetime.now()
        )

        new_report_award_or_fine = await self.reports_repo.create_total_adward_or_fine(report_award_and_fine)

        return new_report_award_or_fine


        