// src/components/DayCell.tsx
import React from "react"
import * as Icons from "../icons/index.ts";

export const DayCell = ({ schedule }: { schedule: any | null }) => {
  if (!schedule) return <div className="day-cell empty"></div>

  const start = new Date(schedule.schedule_start_time)
  const end = new Date(schedule.schedule_end_time)
  const time = `${start.getHours()}:${start.getMinutes().toString().padStart(2, "0")} – ${end.getHours()}:${end.getMinutes().toString().padStart(2, "0")}`

  return (
    <div className={`day-cell filled ${schedule.status}`}>
      <div className="time">{time}</div>
      <div className="icon">
        {schedule.status === "active"}
        {schedule.status === "vacation" && <Icons.VacationIcon />}
        {schedule.status === "sick" && <Icons.MedicalIcon />}
      </div>
    </div>
  )
}
