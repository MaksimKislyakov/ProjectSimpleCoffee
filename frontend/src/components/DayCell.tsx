// src/components/DayCell.tsx
import React, { useState, useRef, useEffect } from "react"
import * as Icons from "../icons/index.ts";
import ConfirmScheduleModal from "./ConfirmScheduleModal.tsx";

interface DayCellProps {
  schedule: any | null;
  day: any;
  user: any;
  currentUserId: number | null;
  currentRoleId: number;
  onConfirmSchedule: (scheduleId: number, startTime?: string, endTime?: string) => Promise<void>;
}

export const DayCell: React.FC<DayCellProps> = ({ 
  schedule, 
  day, 
  user, 
  currentUserId, 
  currentRoleId,
  onConfirmSchedule 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModal &&
        cellRef.current &&
        modalRef.current &&
        !cellRef.current.contains(event.target as Node) &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
        setModalPosition(null);
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  if (!schedule) {
    return <div className="day-cell empty"><div className="empty-slot" /></div>
  }

  const start = new Date(schedule.schedule_start_time)
  const end = new Date(schedule.schedule_end_time)

  const fmt = (d: Date) =>
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false })

  const time = `${fmt(start)}-${fmt(end)}`

  // Определяем тип смены: утренняя или вечерняя
  // Утренняя: заканчивается до 17:00 включительно
  // Вечерняя: начинается с 17:00 включительно
  const endHour = end.getHours();
  const startHour = start.getHours();
  const isMorningShift = endHour < 17 || (endHour === 17 && end.getMinutes() === 0);
  const isEveningShift = startHour >= 17;
  const shiftType = isEveningShift ? "evening" : (isMorningShift ? "morning" : "full");

  // Цвет смены: оранжевый только для рабочих дней (status === "active")
  // Остальные типы смен сохраняют стандартный цвет
  const confirmed = schedule.is_confirmed === true;
  const isWorkDay = schedule.status?.toLowerCase() === "active" || schedule.status?.toLowerCase() === "рабочий день";
  
  let cellClass = "day-cell filled ";
  if (isWorkDay) {
    // Рабочие дни всегда оранжевые (подтвержденные и неподтвержденные)
    cellClass += `shift-work-day shift-${shiftType}`;
  } else {
    // Остальные типы смен: серые если не подтверждены, стандартный цвет если подтверждены
    cellClass += confirmed ? "shift-confirmed" : "shift-unconfirmed";
  }

  // Иконка статуса
  // Иконки не показываем для:
  // - неподтвержденных смен (is_confirmed === false)
  // - рабочих дней (status === "active" или "рабочий день")
  let icon: React.ReactElement | null = null;
  if (confirmed) {
    const status = schedule.status?.toLowerCase();
    if (status === "vacation" || status === "отпуск") {
      icon = <Icons.VacationIcon />;
    } else if (status === "выходной") {
      icon = <Icons.HouseIcon />;
    } else if (status === "sick" || status === "больничный") {
      icon = <Icons.MedicalIcon />;
    }
    // Для "active", "рабочий день" и других статусов иконка остается null
  }

  const handleMouseEnter = () => {
    if (!confirmed && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      // Позиционируем модалку под ячейкой (внизу) относительно viewport (getBoundingClientRect уже дает координаты относительно viewport)
      setModalPosition({
        top: rect.bottom + 10, // 10px отступ снизу
        left: rect.left + rect.width / 2
      });
      setShowModal(true);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Не закрываем модалку при уходе курсора, если он переходит на модалку
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && modalRef.current?.contains(relatedTarget)) {
      return;
    }
  };

  const handleConfirm = async (startTime: string, endTime: string) => {
    if (schedule.id) {
      try {
        await onConfirmSchedule(schedule.id, startTime, endTime);
        setShowModal(false);
        setModalPosition(null);
      } catch (error) {
        // Ошибка обрабатывается в модалке
        throw error;
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalPosition(null);
  };

  return (
    <>
      <div 
        ref={cellRef}
        className={cellClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="day-cell-content">
          {/* Время: сверху для утренней смены, снизу для вечерней */}
          {isWorkDay && shiftType === "evening" ? (
            <>
              {/* Для вечерней смены: иконка сверху (если есть), время снизу */}
              <div className="day-cell-top">
                {confirmed && icon && (
                  <div className="day-cell-icon">{icon}</div>
                )}
              </div>
              <div className="day-cell-time day-cell-time-bottom">{time}</div>
            </>
          ) : (
            <>
              {/* Для утренней смены: время сверху, иконка снизу (если есть) */}
              <div className="day-cell-time day-cell-time-top">{time}</div>
              <div className="day-cell-bottom">
                {confirmed && icon && (
                  <div className="day-cell-icon">{icon}</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {showModal && !confirmed && modalPosition && (
        <ConfirmScheduleModal
          schedule={schedule}
          position={modalPosition}
          onConfirm={handleConfirm}
          onClose={handleCloseModal}
          modalRef={modalRef}
        />
      )}
    </>
  );
}
