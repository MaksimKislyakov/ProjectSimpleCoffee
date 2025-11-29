// src/components/WorkScheduleTable.tsx
import React, { useRef } from "react"
import { EmployeeScheduleRow } from "./EmployeeScheduleRow.tsx"
import { DayData } from "./useScheduleUtils"

interface Props {
  users: any[]
  schedule: any[]
  days: DayData[]
  mode: "week" | "month"
  currentUserId: number | null
  currentRoleId: number
}

const WorkScheduleTable: React.FC<Props> = ({ users, schedule, days, mode, currentUserId, currentRoleId }) => {
  const rightRef = useRef<HTMLDivElement | null>(null)

  // единый шаблон колонок для заголовка и для строк
  const gridTemplate = `repeat(${Math.max(1, days.length)}, 1fr)`

  return (
    <div className="schedule-wrapper">

      {/* ЛЕВАЯ ФИКСИРОВАННАЯ КОЛОНКА */}
      <div className="left-column">
        <div className="left-header">
          <div>
            <p>Сотрудники</p>
            <input type="text" />
          </div>
          
          <div className="table-filter-today">
            <p>Сегодня</p>
            <input type="checkbox" />
          </div>
        </div>

        {users.map(u => (
          <div key={u.id} className="left-employee">
            <div className="name">{u.last_name} {u.first_name?.[0] || ""}. {u.patronymic?.[0] || ""}.</div>
            <div className="role">Бариста</div>
          </div>
        ))}

      </div>

      {/* ПРАВАЯ СКРОЛЛИРУЕМАЯ ЧАСТЬ */}
      <div className="right-area" ref={rightRef}>

        {/* Заголовок дней — grid */}
        <div
          className={`days-header${mode === "week" ? " week-mode" : ""}`}
          style={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            gap: "8px",
            alignItems: "center",
            padding: "8px 4px"
          }}
        >
          {days.map((d, i) => (
            <div className="day-col" key={i}>
              <div className="dow">{d.weekday}</div>
              <div className="day-num">{d.dayNumber}</div>
            </div>
          ))}
        </div>

        {/* Строки сотрудников */}
        <div className="rows">
          {users.map(user => {
            const userSchedule = schedule.filter(s => s.user_id === user.id)
            return (
              <EmployeeScheduleRow
                key={user.id}
                user={user}
                userSchedule={userSchedule}
                days={days}
                mode={mode}
                currentUserId={currentUserId}
                currentRoleId={currentRoleId}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default WorkScheduleTable;
