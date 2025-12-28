import React, { useState, useRef, useEffect, useCallback } from "react";
import "../styles/reportDateRangePicker.css";
import * as Icons from "../icons/index.ts";

interface ReportDateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLDivElement | null>;
}

const ReportDateRangePicker: React.FC<ReportDateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  onClose,
  buttonRef,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate));
  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(endDate);
  const [selectingStart, setSelectingStart] = useState(true);
  const calendarRef = useRef<HTMLDivElement>(null);

  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // Функция для позиционирования календаря
  const positionCalendar = useCallback(() => {
    if (buttonRef?.current && calendarRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      // Динамически получаем размеры календаря
      const calendarRect = calendarRef.current.getBoundingClientRect();
      const calendarWidth = calendarRect.width || Math.min(140, window.innerWidth - 32);
      const calendarHeight = calendarRect.height || Math.min(160, window.innerHeight - 32);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth <= 394;
      const offset = Math.max(8, viewportWidth * 0.02); // Гибкий отступ (2% от ширины экрана)
      const margin = Math.max(16, viewportWidth * 0.04); // Гибкий отступ от краев (4% от ширины экрана)
      
      let left: number;
      let top = buttonRect.bottom + offset;
      
      if (isMobile) {
        // В мобильной версии - позиционируем под кнопкой у правой стороны (выравниваем правый край)
        left = buttonRect.right - calendarWidth;
        
        // Проверяем правую границу - если календарь выходит за правый край экрана
        if (left + calendarWidth > viewportWidth - margin) {
          left = viewportWidth - calendarWidth - margin;
        }
        
        // Проверяем левую границу - если календарь выходит за левый край экрана
        if (left < margin) {
          left = margin;
        }
      } else {
        // В веб-версии - позиционируем под кнопкой (выравниваем левый край)
        left = buttonRect.left;
        
        // Проверяем правую границу
        if (left + calendarWidth > viewportWidth - margin) {
          left = viewportWidth - calendarWidth - margin;
        }
        
        // Проверяем левую границу
        if (left < margin) {
          left = margin;
        }
      }
      
      // Проверяем нижнюю границу - если не помещается снизу, показываем сверху
      if (top + calendarHeight > viewportHeight - margin) {
        top = buttonRect.top - calendarHeight - offset;
      }
      
      // Проверяем верхнюю границу
      if (top < margin) {
        top = margin;
      }
      
      calendarRef.current.style.top = `${top}px`;
      calendarRef.current.style.left = `${left}px`;
    }
  }, [buttonRef]);

  // Позиционирование календаря относительно кнопки с проверкой границ
  useEffect(() => {
    // Задержка для получения актуальных размеров после рендера
    const timeoutId = setTimeout(() => {
      positionCalendar();
    }, 10);

    // Дополнительная проверка после небольшой задержки для точного расчета размеров
    const timeoutId2 = setTimeout(() => {
      positionCalendar();
    }, 100);

    // Обработка изменения размеров окна
    const handleResize = () => {
      positionCalendar();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      window.removeEventListener('resize', handleResize);
    };
  }, [positionCalendar, currentMonth]);

  // Закрытие при клике вне календаря
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef?.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, buttonRef]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Понедельник = 0

    const days: (Date | null)[] = [];
    
    // Дни предыдущего месяца
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(prevYear, prevMonth, prevMonthLastDay - i));
    }
    
    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Дни следующего месяца для заполнения сетки (до 42 ячеек всего)
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const totalCells = 42; // 6 недель * 7 дней
    const remainingCells = totalCells - days.length;
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push(new Date(nextYear, nextMonth, day));
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      setSelectedStart(date);
      setSelectedEnd(null);
      setSelectingStart(false);
    } else {
      if (date < selectedStart!) {
        // Если выбрана дата раньше начальной, меняем местами
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    if (selectedStart && selectedEnd) {
      // Устанавливаем время на начало и конец дня
      const start = new Date(selectedStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedEnd);
      end.setHours(23, 59, 59, 999);
      onDateChange(start, end);
      onClose();
    }
  };

  const handleReset = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    setSelectedStart(firstDay);
    setSelectedEnd(lastDay);
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateInRange = (date: Date) => {
    if (!selectedStart || !selectedEnd) return false;
    return date >= selectedStart && date <= selectedEnd;
  };

  const isDateSelected = (date: Date) => {
    if (selectedStart && date.getTime() === selectedStart.getTime()) return true;
    if (selectedEnd && date.getTime() === selectedEnd.getTime()) return true;
    return false;
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="report-date-range-picker-overlay">
      <div ref={calendarRef} className="report-date-range-picker">
        <div className="report-calendar-header">
          <button className="report-calendar-nav-btn" onClick={goToPrevMonth}>
            ‹
          </button>
          <span className="report-calendar-month">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button className="report-calendar-nav-btn" onClick={goToNextMonth}>
            ›
          </button>
        </div>

        <div className="report-calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="report-calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="report-calendar-days">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="report-calendar-day empty" />;
            }

            const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && 
                                   date.getFullYear() === currentMonth.getFullYear();
            const isInRange = isCurrentMonth && isDateInRange(date);
            const isSelected = isCurrentMonth && isDateSelected(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toISOString()}
                className={`report-calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isInRange ? "in-range" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                onClick={() => {
                  if (isCurrentMonth) {
                    handleDateClick(date);
                  }
                }}
                style={{ cursor: isCurrentMonth ? 'pointer' : 'default' }}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        <div className="report-calendar-actions">
          <button className="report-calendar-reset-btn" onClick={handleReset}>
            Текущий месяц
          </button>
          <button
            className="report-calendar-apply-btn"
            onClick={handleApply}
            disabled={!selectedStart || !selectedEnd}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDateRangePicker;

