// src/components/DayCell.tsx
import React from "react"
import * as Icons from "../icons/index.ts";

interface DayCellProps {
  schedule: any | null;
  day: any;
  user: any;
  currentUserId: number | null;
  currentRoleId: number;
  onConfirmSchedule: (scheduleId: number) => Promise<void>;
}

export const DayCell: React.FC<DayCellProps> = ({ 
  schedule, 
  day, 
  user, 
  currentUserId, 
  currentRoleId,
  onConfirmSchedule 
}) => {
  if (!schedule) {
    return <div className="day-cell empty"><div className="empty-slot" /></div>
  }

  const start = new Date(schedule.schedule_start_time)
  const end = new Date(schedule.schedule_end_time)

  const fmt = (d: Date) =>
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false })

  const time = `${fmt(start)}-${fmt(end)}`

  // Цвет смены: серый если не подтверждена, оранжевый если подтверждена
  const confirmed = schedule.is_confirmed === true;
  let cellClass = "day-cell filled ";
  cellClass += confirmed ? "shift-confirmed" : "shift-unconfirmed";

  // Иконка статуса
  let icon: React.ReactElement | null = null;
  if (schedule.status === "vacation" || schedule.status === "выходной") {
    icon = <Icons.VacationIcon />;
  } else if (schedule.status === "sick" || schedule.status === "больничный") {
    icon = <Icons.MedicalIcon />;
  }

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (schedule.id) {
      await onConfirmSchedule(schedule.id);
    }
  };

  return (
    <div className={cellClass}>
      <div className="day-cell-content">
        {/* Время рабочего дня всегда сверху */}
        <div className="day-cell-time">{time}</div>
        
        {/* Нижняя часть: иконка для подтвержденных, кнопка для неподтвержденных */}
        <div className="day-cell-bottom">
          {confirmed ? (
            <div className="day-cell-icon">{icon}</div>
          ) : (
            <button 
              className="day-cell-confirm-btn" 
              onClick={handleConfirm}
              title="Подтвердить смену"
            >
              Подтвердить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
