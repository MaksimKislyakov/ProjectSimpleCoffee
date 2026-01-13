// src/components/DayCell.tsx
import React, { useState, useRef, useEffect } from "react"
import * as Icons from "../icons/index.ts";
import ConfirmScheduleModal from "./ConfirmScheduleModal.tsx";
import AddScheduleModal from "./AddScheduleModal.tsx";

interface DayCellProps {
  schedule: any | null;
  day: any;
  user: any;
  currentUserId: number | null;
  currentRoleId: number;
  onConfirmSchedule: (scheduleId: number, startTime?: string, endTime?: string) => Promise<void>;
  onDeleteSchedule?: (scheduleId: number) => Promise<void>;
  onCreateSchedule?: (date: Date, startTime: string, endTime: string, targetUserId?: number) => Promise<void>;
  openModalScheduleId: number | null;
  setOpenModalScheduleId: (id: number | null) => void;
  openAddModalKey: string | null;
  setOpenAddModalKey: (key: string | null) => void;
  mode: "week" | "month";
}

export const DayCell: React.FC<DayCellProps> = ({ 
  schedule, 
  day, 
  user, 
  currentUserId, 
  currentRoleId,
  onConfirmSchedule,
  onDeleteSchedule,
  onCreateSchedule,
  openModalScheduleId,
  setOpenModalScheduleId,
  openAddModalKey,
  setOpenAddModalKey,
  mode
}) => {
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
  const [addModalPosition, setAddModalPosition] = useState<{ top: number; left: number } | null>(null);
  const [addModalStartTime, setAddModalStartTime] = useState<string>("09:00");
  const [addModalEndTime, setAddModalEndTime] = useState<string>("21:00");
  const cellRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);

  // Создаем уникальный ключ для этой ячейки: userId-dateISO
  const addModalKey = `${user.id}-${day.fullDate.toISOString()}`;
  const showAddModal = openAddModalKey === addModalKey;
  const showModal = schedule && !schedule.is_confirmed && openModalScheduleId === schedule.id;
  
  // Проверяем, может ли текущий пользователь создавать смены для этого пользователя
  // Роль 3 может создавать смены только для себя, роли 1 и 2 - для любого пользователя
  const canCreateSchedule = onCreateSchedule && (
    currentRoleId === 1 || 
    currentRoleId === 2 ||
    (currentRoleId === 3 && currentUserId === user.id)
  );

  const handleEmptyCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canCreateSchedule && cellRef.current) {
      // Закрываем другие модалки при открытии новой
      setOpenModalScheduleId(null);
      
      const rect = cellRef.current.getBoundingClientRect();
      const modalWidth = 249; // Ширина модалки из CSS
      const modalHeight = 200; // Примерная высота модалки
      const spacing = 5; // Уменьшенный отступ от ячейки для более близкого расположения
      
      // Вычисляем позицию по горизонтали (центрируем относительно ячейки)
      let left = rect.left + rect.width / 2;
      
      // Проверяем, не выходит ли модалка за правый край экрана
      if (left + modalWidth / 2 > window.innerWidth) {
        left = window.innerWidth - modalWidth / 2 - 10; // Отступ от края
      }
      // Проверяем, не выходит ли модалка за левый край экрана
      if (left - modalWidth / 2 < 0) {
        left = modalWidth / 2 + 10; // Отступ от края
      }
      
      // Вычисляем позицию по вертикали - позиционируем модалку так, чтобы она частично перекрывала ячейку
      // Смещаем модалку вверх на часть её высоты, чтобы она была "над" ячейкой
      const overlapOffset = 30; // Насколько модалка перекрывает ячейку сверху
      let top = rect.bottom - overlapOffset;
      
      // Проверяем, помещается ли модалка снизу
      const spaceBelow = window.innerHeight - rect.bottom + overlapOffset;
      const spaceAbove = rect.top;
      
      // Если модалка не помещается снизу, но помещается сверху - показываем сверху
      if (spaceBelow < modalHeight && spaceAbove >= modalHeight) {
        top = rect.top - modalHeight + overlapOffset;
      }
      // Если не помещается ни снизу, ни сверху - показываем по центру экрана
      else if (spaceBelow < modalHeight && spaceAbove < modalHeight) {
        top = window.innerHeight / 2;
      }
      
      setAddModalPosition({
        top,
        left
      });
      // Сбрасываем время только при первом открытии этой ячейки
      if (openAddModalKey !== addModalKey) {
        setAddModalStartTime("09:00");
        setAddModalEndTime("21:00");
      }
      setOpenAddModalKey(addModalKey);
    }
  };

  const handleCreateSchedule = async (startTime: string, endTime: string) => {
    if (onCreateSchedule) {
      try {
        await onCreateSchedule(day.fullDate, startTime, endTime, user.id);
        setOpenAddModalKey(null);
        setAddModalPosition(null);
      } catch (error) {
        throw error;
      }
    }
  };

  const handleCloseAddModal = () => {
    setOpenAddModalKey(null);
    setAddModalPosition(null);
    // Не сбрасываем время при закрытии, чтобы сохранить его для следующего открытия
  };

  const handleTimeChange = (startTime: string, endTime: string) => {
    setAddModalStartTime(startTime);
    setAddModalEndTime(endTime);
  };

  // Закрываем модалку добавления при клике на другую ячейку (для подтверждения смены)
  useEffect(() => {
    if (openModalScheduleId !== null && showAddModal) {
      setOpenAddModalKey(null);
      setAddModalPosition(null);
    }
  }, [openModalScheduleId, showAddModal, setOpenAddModalKey]);

  if (!schedule) {
    return (
      <>
        <div 
          className="day-cell empty"
          onClick={canCreateSchedule ? handleEmptyCellClick : undefined}
          style={{ cursor: canCreateSchedule ? 'pointer' : 'default' }}
          ref={cellRef}
        >
          <div className="empty-slot" />
        </div>
        {showAddModal && addModalPosition && (
          <AddScheduleModal
            key={addModalKey}
            date={day.fullDate}
            position={addModalPosition}
            onConfirm={handleCreateSchedule}
            onClose={handleCloseAddModal}
            modalRef={addModalRef}
            initialStartTime={addModalStartTime}
            initialEndTime={addModalEndTime}
            onTimeChange={handleTimeChange}
          />
        )}
      </>
    );
  }

  const start = new Date(schedule.schedule_start_time)
  const end = new Date(schedule.schedule_end_time)

  const fmt = (d: Date) =>
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false })

  // Для рабочих дней: время без дефиса (например, "09:00 17:00")
  // Для не-рабочих дней: время не показываем
  const confirmed = schedule.is_confirmed === true;
  const statusLower = schedule.status?.toLowerCase() || "";
  const isWorkDay = statusLower === "active" || statusLower === "рабочий день";
  
  // Если смена подтверждена и не является явным выходным/отпуском/больничным, 
  // то считаем её рабочей сменой (для отображения оранжевым цветом)
  const isNonWorkStatus = statusLower === "выходной" || statusLower === "vacation" || 
                          statusLower === "отпуск" || statusLower === "sick" || 
                          statusLower === "больничный";
  const isConfirmedWorkShift = confirmed && !isNonWorkStatus && schedule.schedule_start_time && schedule.schedule_end_time;
  
  // Определяем финальный статус: рабочая смена или нет
  const finalIsWorkDay = isWorkDay || isConfirmedWorkShift;
  
  // Формируем время только для рабочих дней
  // В режиме месяца: одна строка "09:00 17:00"
  // В режиме недели: время начала и окончания раздельно
  const startTimeStr = fmt(start);
  const endTimeStr = fmt(end);
  const time = finalIsWorkDay ? (mode === "week" ? null : `${startTimeStr} ${endTimeStr}`) : "";

  // Определяем тип смены: утренняя или вечерняя (только для рабочих дней)
  let shiftType = "full";
  if (finalIsWorkDay) {
    const endHour = end.getHours();
    const startHour = start.getHours();
    const isMorningShift = endHour < 17 || (endHour === 17 && end.getMinutes() === 0);
    const isEveningShift = startHour >= 17;
    shiftType = isEveningShift ? "evening" : (isMorningShift ? "morning" : "full");
  }
  
  let cellClass = "day-cell filled ";
  if (finalIsWorkDay) {
    // Рабочие дни: оранжевые если подтверждены, серые если не подтверждены
    if (confirmed) {
      cellClass += `shift-work-day shift-${shiftType}`;
    } else {
      cellClass += "shift-unconfirmed";
    }
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

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Только роли 1 и 2 могут подтверждать смены
    const canConfirm = currentRoleId === 1 || currentRoleId === 2;
    
    if (!confirmed && schedule && cellRef.current && canConfirm) {
      // Если кликнули на уже открытую модалку, закрываем её
      if (openModalScheduleId === schedule.id) {
        setOpenModalScheduleId(null);
        setModalPosition(null);
        return;
      }
      
      // Открываем модалку для этой смены
      const rect = cellRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2
      });
      setOpenModalScheduleId(schedule.id);
    }
  };

  const handleConfirm = async (startTime: string, endTime: string) => {
    if (schedule && schedule.id) {
      try {
        await onConfirmSchedule(schedule.id, startTime, endTime);
        setOpenModalScheduleId(null);
        setModalPosition(null);
      } catch (error) {
        // Ошибка обрабатывается в модалке
        throw error;
      }
    }
  };

  const handleDelete = async () => {
    if (schedule && schedule.id && onDeleteSchedule) {
      try {
        await onDeleteSchedule(schedule.id);
        // Закрываем модалку после успешного удаления
        setOpenModalScheduleId(null);
        setModalPosition(null);
      } catch (error) {
        // Пробрасываем ошибку в модалку для отображения
        console.error("Ошибка удаления смены в DayCell:", error);
        throw error;
      }
    } else {
      throw new Error("Не удалось удалить смену: отсутствуют необходимые данные");
    }
  };

  const handleCloseModal = () => {
    setOpenModalScheduleId(null);
    setModalPosition(null);
  };

  return (
    <>
      <div 
        ref={cellRef}
        className={cellClass}
        onClick={handleCellClick}
        style={{ 
          cursor: (!confirmed && (currentRoleId === 1 || currentRoleId === 2)) 
            ? 'pointer' 
            : 'default' 
        }}
      >
        <div className="day-cell-content">
          {/* Для неподтвержденных смен: время всегда вверху */}
          {!confirmed && schedule.schedule_start_time && schedule.schedule_end_time ? (
            <>
              <div className="day-cell-time day-cell-time-top">{startTimeStr}</div>
              <div className="day-cell-time day-cell-time-top">{endTimeStr}</div>
            </>
          ) : finalIsWorkDay ? (
            mode === "week" ? (
              shiftType === "evening" ? (
                <>
                  {/* Режим недели, вечерняя смена: начало сверху, конец снизу */}
                  <div className="day-cell-time day-cell-time-top">{startTimeStr}</div>
                  <div className="day-cell-time day-cell-time-bottom">{endTimeStr}</div>
                </>
              ) : shiftType === "morning" ? (
                <>
                  {/* Режим недели, утренняя смена: начало и конец вверху */}
                  <div className="day-cell-time day-cell-time-top">{startTimeStr}</div>
                  <div className="day-cell-time day-cell-time-top">{endTimeStr}</div>
                </>
              ) : (
                <>
                  {/* Режим недели, полная смена: начало и конец вверху */}
                  <div className="day-cell-time day-cell-time-top">{startTimeStr}</div>
                  <div className="day-cell-time day-cell-time-top">{endTimeStr}</div>
                </>
              )
            ) : shiftType === "evening" ? (
              <>
                {/* Режим месяца, вечерняя смена: начало сверху, конец снизу */}
                <div className="day-cell-time day-cell-time-top">{startTimeStr}</div>
                <div className="day-cell-time day-cell-time-bottom">{endTimeStr}</div>
              </>
            ) : shiftType === "morning" ? (
              <>
                {/* Режим месяца, утренняя смена: начало и конец вверху */}
                <div className="day-cell-time day-cell-time-top">{startTimeStr}</div>
                <div className="day-cell-time day-cell-time-top">{endTimeStr}</div>
              </>
            ) : (
              <>
                {/* Режим месяца, полная смена: начало и конец вверху */}
                <div className="day-cell-time day-cell-time-top">{startTimeStr}</div>
                <div className="day-cell-time day-cell-time-top">{endTimeStr}</div>
              </>
            )
          ) : (
            <>
              {/* Для не-рабочих дней: только иконка снизу (если есть) */}
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
          onDelete={handleDelete}
          onClose={handleCloseModal}
          modalRef={modalRef}
        />
      )}
    </>
  );
}
