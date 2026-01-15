// src/components/WorkSchedule/WorkScheduleHeader.tsx

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import * as Icons from "../icons/index.ts"
import { getTwoWeeksLabel } from "./useScheduleUtils.tsx"

interface Props {
  currentDate: Date
  mode: "week" | "month"
  onPrev: () => void
  onNext: () => void
  onModeChange: (m: "week" | "month") => void
  onSettingsClick?: () => void
  onCalendarClick?: () => void
  calendarButtonRef?: React.RefObject<HTMLDivElement | null>
  showSettings?: boolean
}

const WorkScheduleHeader: React.FC<Props> = ({
  currentDate,
  mode,
  onPrev,
  onNext,
  onModeChange,
  onSettingsClick,
  onCalendarClick,
  calendarButtonRef,
  showSettings = true,
}) => {
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 394);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 394);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Форматируем период в зависимости от режима
  const getPeriodLabel = () => {
    // В мобильной версии показываем только название месяца
    if (isMobile) {
      return getTwoWeeksLabel(currentDate);
    }
    const year = currentDate.getFullYear();
    
    if (mode === "week") {
      const start = new Date(currentDate);
      
      // Вычисляем смещение до ближайшей прошедшей среды (среда = 3)
      // Неделя: Ср, Чт, Пт, Сб, Вс, Пн, Вт
      const dayOfWeek = currentDate.getDay();
      let offsetToWednesday: number;
      
      if (dayOfWeek === 0) { // Воскресенье - идем к среде 4 дня назад
        offsetToWednesday = -4;
      } else if (dayOfWeek === 1) { // Понедельник - идем к среде 5 дней назад (прошлая неделя)
        offsetToWednesday = -5;
      } else if (dayOfWeek === 2) { // Вторник - идем к среде 6 дней назад (прошлая неделя)
        offsetToWednesday = -6;
      } else if (dayOfWeek === 3) { // Среда - начало недели
        offsetToWednesday = 0;
      } else if (dayOfWeek === 4) { // Четверг - идем к среде 1 день назад
        offsetToWednesday = -1;
      } else if (dayOfWeek === 5) { // Пятница - идем к среде 2 дня назад
        offsetToWednesday = -2;
      } else { // Суббота (6) - идем к среде 3 дня назад
        offsetToWednesday = -3;
      }
      
      start.setDate(currentDate.getDate() + offsetToWednesday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const startDay = start.getDate();
      const endDay = end.getDate();
      const month = start.toLocaleDateString("ru-RU", { month: "long" });
      
      if (start.getMonth() === end.getMonth()) {
        return `${startDay} - ${endDay} ${month} ${year}`;
      } else {
        const startMonth = start.toLocaleDateString("ru-RU", { month: "long" });
        const endMonth = end.toLocaleDateString("ru-RU", { month: "long" });
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
      }
    } else {
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDate();
      const endDay = lastDay.getDate();
      const monthName = currentDate.toLocaleDateString("ru-RU", { month: "long" });
      return `${startDay} - ${endDay} ${monthName} ${year}`;
    }
  };

  return (
    <div className="schedule-header">
      {/* Блок 1: График работы со стрелкой */}
      <div className="schedule-header-block schedule-header-left">
        <div className="go-to-schedule" onClick={() => navigate("/profile")}>
          <Icons.ArrowIcon className="go-to-icon"/> <p>График работы</p> 
        </div>
      </div>
      
      {/* Блок 2: Календарь со стрелками (только для веб-версии) */}
      {!isMobile && (
        <div className="schedule-header-block schedule-header-center">
          <div className="currentPeriod">
            <div className="calendar">
              <Icons.CalendarIcon title="календарь"/>
              <span className="label">{getPeriodLabel()}</span>
            </div>
            <div className="arrows">
              <button className="arrowBtn" onClick={onPrev}>‹</button>
              <button className="arrowBtn" onClick={onNext}>›</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Мобильная версия: календарь и кнопка настроек */}
      {isMobile && (
        <>
          <div className="schedule-header-block schedule-header-center">
            <div 
              className="calendar"
              ref={calendarButtonRef}
              onClick={onCalendarClick ? onCalendarClick : undefined}
              style={onCalendarClick ? { cursor: 'pointer' } : {}}
            >
              <Icons.CalendarIcon title="календарь"/>
              <span className="label">{getPeriodLabel()}</span>
            </div>
          </div>
          {showSettings && onSettingsClick && (
            <button 
              className="mobile-settings-btn"
              onClick={onSettingsClick}
              title="Редактировать график"
            >
              <Icons.SettingsIcon />
            </button>
          )}
        </>
      )}
      
      {/* Блок 3: Фильтры и кнопка настроек (только для веб-версии) */}
      {!isMobile && (
        <div className="schedule-header-block schedule-header-right">
          <div className="filters">
            <button
              className={`filterBtn ${mode === "week" ? "active" : ""}`}
              onClick={() => onModeChange("week")}
            >
              Неделя
            </button>
            <button
              className={`filterBtn ${mode === "month" ? "active" : ""}`}
              onClick={() => onModeChange("month")}
            >
              Месяц
            </button>
            {showSettings && onSettingsClick && (
              <Icons.SettingsIcon 
                className="settingsBtn" 
                onClick={onSettingsClick}
                style={{ cursor: "pointer" }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkScheduleHeader
