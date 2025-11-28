// src/components/DayCell.tsx
import React from "react"
import * as Icons from "../icons/index.ts";

export const DayCell: React.FC<{ schedule: any | null }> = ({ schedule }) => {
  if (!schedule) {
    return <div className="day-cell empty"><div className="empty-slot" /></div>
  }

  const start = new Date(schedule.schedule_start_time)
  const end = new Date(schedule.schedule_end_time)

  const fmt = (d: Date) =>
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false })

  const time = `${fmt(start)} ${fmt(end)}`

  return (
    <div className={`day-cell filled ${schedule.status || ""}`}>
      <div className={`shift ${schedule.status === "active" ? "" : "shift-gray"}`}>
        <div className="shift-text">{time}</div>
      </div>
      <div className="icon">
        {schedule.status === "vacation" && <Icons.VacationIcon />}
        {schedule.status === "sick" && <Icons.MedicalIcon />}
      </div>
    </div>
  )
}
