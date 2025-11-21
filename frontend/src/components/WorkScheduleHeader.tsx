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
  const monthName = currentDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric"
  })

  const navigate = useNavigate();
  const handleGoToProfile = () => navigate("/profile");

  return (
    <div className="schedule-header">
      <div className="go-to-schedule" onClick={() => navigate("/profile")}>
        <Icons.ArrowIcon className="go-to-icon"/> <p>График работы</p> 
      </div>
      <button onClick={onPrev}>‹</button>
      <span className="label">{monthName}</span>
      <button onClick={onNext}>›</button>

      <div className="mode-switch">
        <button
          className={mode === "week" ? "active" : ""}
          onClick={() => onModeChange("week")}
        >
          Неделя
        </button>
        <button
          className={mode === "month" ? "active" : ""}
          onClick={() => onModeChange("month")}
        >
          Месяц
        </button>
      </div>
    </div>
  )
}

export default WorkScheduleHeader
