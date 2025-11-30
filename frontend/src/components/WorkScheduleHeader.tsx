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
}

const WorkScheduleHeader: React.FC<Props> = ({
  currentDate,
  mode,
  onPrev,
  onNext,
  onModeChange,
}) => {
  const navigate = useNavigate();
  const handleGoToProfile = () => navigate("/profile");

  // Форматируем период в зависимости от режима
  const getPeriodLabel = () => {
    if (mode === "week") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      const startDay = start.getDate();
      const endDay = end.getDate();
      const month = start.toLocaleDateString("ru-RU", { month: "long" });
      
      if (start.getMonth() === end.getMonth()) {
        return `${startDay} - ${endDay} ${month}`;
      } else {
        const startMonth = start.toLocaleDateString("ru-RU", { month: "long" });
        const endMonth = end.toLocaleDateString("ru-RU", { month: "long" });
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      }
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDay = firstDay.getDate();
      const endDay = lastDay.getDate();
      const monthName = currentDate.toLocaleDateString("ru-RU", { month: "long" });
      return `${startDay} - ${endDay} ${monthName}`;
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
        <Icons.SettingsIcon className="settingsBtn"/>
      </div>
    </div>
  )
}

export default WorkScheduleHeader
