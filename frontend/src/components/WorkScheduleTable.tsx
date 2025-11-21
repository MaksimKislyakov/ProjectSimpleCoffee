// src/components/WorkSchedule/WorkScheduleTable.tsx

import React from "react"
import { EmployeeScheduleRow } from "./EmployeeScheduleRow.tsx"
import { DayData } from "./useScheduleUtils"

interface Props {
  users: any[]
  schedule: any[]
  days: DayData[]
}

const WorkScheduleTable: React.FC<Props> = ({ users, schedule, days }) => {
  return (
    <div className="schedule-table">
      <div className="header-row">
        <div className="label-col">Сотрудники</div>
        <div className="days-header">
          {days.map((d, i) => (
            <div key={i} className="day-header">
              {d.date}
            </div>
          ))}
        </div>
      </div>

      {users.map(user => {
        const userSchedule = schedule.filter(s => s.user_id === user.id)

        return (
          <EmployeeScheduleRow
            key={user.id}
            user={user}
            days={days}
            userSchedule={userSchedule}
          />
        )
      })}
    </div>
  )
}

export default WorkScheduleTable
