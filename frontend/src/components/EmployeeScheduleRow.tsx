// src/components/EmployeeScheduleRow.tsx

import React from "react"
import { DayData } from "./useScheduleUtils.tsx"
import { DayCell } from "./DayCell.tsx"

interface EmployeeScheduleRowProps {
  user: any
  days: DayData[]
  userSchedule: any[]
}

export const EmployeeScheduleRow: React.FC<EmployeeScheduleRowProps> = ({
  user,
  days,
  userSchedule,
}) => {
  return (
    <div className="employee-row">
      <div className="left-col">
        <h4>{user.last_name} {user.first_name[0]}. {user.patronymic[0]}.</h4>
        <p>Бариста</p>
      </div>

      <div className="days-row">
        {days.map((day, index) => {
          const match = userSchedule.find(s =>
            new Date(s.schedule_start_time).toDateString() === day.fullDate.toDateString()
          )

          return <DayCell key={index} schedule={match || null} />
        })}
      </div>
    </div>
  )
}
