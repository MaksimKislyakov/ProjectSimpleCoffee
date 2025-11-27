from typing import List, Tuple
from datetime import datetime


class CalculateServices:
    def _count_work_time(dates: List[List[datetime]]) -> Tuple[int, int]:
        """Подсчитывает общее отработанное время из списка смен.
        
        Args:
            dates: Список смен в формате [[start_time, end_time, status], ...]
            
        Returns:
            Tuple[int, int]: Кортеж (часы, минуты) общего отработанного времени
        """
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
        """Подсчитывает количество отработанных дней/смен.
        
        Args:
            dates: Список смен в формате [[start_time, end_time, status], ...]
            
        Returns:
            int: Количество завершенных рабочих смен
        """
        work_days = 0
        now = datetime.now()

        for start_time, end_time, status in dates:
            if status == "Рабочая смена" and end_time <= now and end_time > start_time:
                work_days += 1

        return work_days
    
    def _count_total_salary(hourly_rate: float, total_hours: float) -> float:
        """Рассчитывает общую заработную плату.
        
        Args:
            hourly_rate: Почасовая ставка
            total_hours: Общее количество отработанных часов
            
        Returns:
            float: Общая сумма заработка
        """
        total_salary = hourly_rate * total_hours
        return total_salary
    
    def _count_total_award_and_fine(data_total_award_and_fine):
        total_award_sum = 0
        total_fine_sum = 0 
        
        for award, fine in data_total_award_and_fine: 
            total_award_sum += award if award else 0  
            total_fine_sum += fine if fine else 0     

        return total_award_sum, total_fine_sum
        