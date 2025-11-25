from typing import List, Tuple
from datetime import datetime


class CalculateServices:
    def _count_work_time(dates: List[List[datetime]]) -> Tuple[int, int]:
        total_seconds = 0
        now = datetime.now()
        
        for start_time, end_time, _ in dates:
            if (not start_time or not end_time):
                continue
                
            # смены только до текущего дня
            if end_time <= now and end_time > start_time:
                duration = end_time - start_time
                total_seconds += duration.total_seconds()
        
        total_minutes = int(total_seconds // 60)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        return hours, minutes
    
    def _count_shifts_day(dates: List[List[datetime]]) -> int:
        work_days = 0
        now = datetime.now()

        for start_time, end_time, status in dates:
            if status == "Рабочая смена" and end_time <= now and end_time > start_time:
                work_days += 1

        return work_days
    
    def _count_total_salary(hourly_rate: int, total_hours: int) -> float:
        total_salary = hourly_rate * total_hours
        return total_salary