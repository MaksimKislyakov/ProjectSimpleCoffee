// src/components/DayCell.tsx
import React from "react"
import * as Icons from "../icons/index.ts";

export const DayCell: React.FC<{ schedule: any | null, day: any, user: any, currentUserId: number | null, currentRoleId: number }> = ({ schedule, day, user, currentUserId, currentRoleId }) => {
  if (!schedule) {
    return <div className="day-cell empty"><div className="empty-slot" /></div>
  }

  const start = new Date(schedule.schedule_start_time)
  const end = new Date(schedule.schedule_end_time)

  const fmt = (d: Date) =>
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false })

  const time = `${fmt(start)} ${fmt(end)}`

  // Цвет смены: серый если не подтверждена, оранжевый если подтверждена
  const confirmed = schedule.is_confirmed === true;
  let cellClass = "day-cell filled ";
  cellClass += confirmed ? "shift-confirmed" : "shift-unconfirmed";

  // Иконка статуса
  let icon = null;
  if (schedule.status === "work" || schedule.status === "рабочий день" || schedule.status === "active") {
    icon = <Icons.BriefcaseIcon />;
  } else if (schedule.status === "vacation" || schedule.status === "выходной") {
    icon = <Icons.VacationIcon />;
  } else if (schedule.status === "sick" || schedule.status === "больничный") {
    icon = <Icons.MedicalIcon />;
  }

  return (
    <div className={cellClass}>
      <div className="icon">{icon}</div>
    </div>
  );
}
