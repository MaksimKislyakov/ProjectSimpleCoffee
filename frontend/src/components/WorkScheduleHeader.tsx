// src/components/WorkSchedule/WorkScheduleHeader.tsx

import React from "react"
import { useNavigate } from "react-router-dom"
import * as Icons from "../icons/index.ts"

interface Props {
  currentDate: Date
  mode: "week" | "month"
  onPrev: () => void
  onNext: () => void
  onModeChange: (m: "week" | "month") => void
  onSettingsClick?: () => void
  showSettings?: boolean
}

const WorkScheduleHeader: React.FC<Props> = ({
  currentDate,
  mode,
  onPrev,
  onNext,
  onModeChange,
  onSettingsClick,
  showSettings = true,
}) => {
  const navigate = useNavigate();
  const handleGoToProfile = () => navigate("/profile");

  // Форматируем период в зависимости от режима
  const getPeriodLabel = () => {
    const year = currentDate.getFullYear();
    
    if (mode === "week") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
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
      <div className="go-to-schedule" onClick={() => navigate("/profile")}>
        <Icons.ArrowIcon className="go-to-icon"/> <p>График работы</p> 
      </div>
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
        {showSettings && (
          <Icons.SettingsIcon 
            className="settingsBtn" 
            onClick={onSettingsClick}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>
    </div>
  )
}

export default WorkScheduleHeader
