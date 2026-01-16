import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/confirmScheduleModal.css";

interface ConfirmScheduleModalProps {
  schedule: any;
  position: { top: number; left: number } | null;
  onConfirm: (startTime: string, endTime: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
  modalRef?: React.RefObject<HTMLDivElement | null>;
}

const ConfirmScheduleModal: React.FC<ConfirmScheduleModalProps> = ({ 
  schedule, 
  position, 
  onConfirm, 
  onDelete,
  onClose,
  modalRef
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<HTMLSelectElement>(null);

  // Генерация времени с шагом 15 минут (с 6:00 до 23:45)
  const generateTimeOptions = () => {
    const options: string[] = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Используем useRef для отслеживания предыдущих значений schedule.id и position
  const prevScheduleIdRef = useRef<number | null>(null);
  const prevPositionRef = useRef<{ top: number; left: number } | null>(null);

  // Функя для округленя времени до ближайших 15 минут
  const roundTo15Minutes = (time: string): string => {
    if (!time) return time;
    const [hours, minutes] = time.split(":").map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const finalHours = hours + Math.floor(roundedMinutes / 60);
    const finalMinutes = roundedMinutes % 60;
    return `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (schedule && position) {
      const scheduleIdChanged = prevScheduleIdRef.current !== schedule.id;
      const positionChanged = 
        prevPositionRef.current?.top !== position.top || 
        prevPositionRef.current?.left !== position.left;
      
      // Обновляем время только если модалка только что открылась (schedule.id или position изменились)
      if (scheduleIdChanged || positionChanged) {
        const start = new Date(schedule.schedule_start_time);
        const end = new Date(schedule.schedule_end_time);
        
        const formatTime = (d: Date) => {
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
        };
        
        // Округляем время до 15 минут при инициализации
        const startTimeStr = formatTime(start);
        const endTimeStr = formatTime(end);
        
        let roundedStart = roundTo15Minutes(startTimeStr);
        let roundedEnd = roundTo15Minutes(endTimeStr);
        
        // Ограничиваем время диапазоном 6:00 - 23:45
        if (roundedStart < "06:00") {
          roundedStart = "06:00";
        }
        if (roundedEnd < "06:00") {
          roundedEnd = "06:00";
        }
        if (roundedStart > "23:45") {
          roundedStart = "23:45";
        }
        if (roundedEnd > "23:45") {
          roundedEnd = "23:45";
        }
        
        setStartTime(roundedStart);
        setEndTime(roundedEnd);
        setError(null);
        
        // Фокус на первое поле при открытии
        setTimeout(() => {
          startTimeRef.current?.focus();
        }, 100);
      }
      
      prevScheduleIdRef.current = schedule.id;
      prevPositionRef.current = position;
    } else {
      // Когда модалка закрывается, сбрасываем предыдущие значения
      prevScheduleIdRef.current = null;
      prevPositionRef.current = null;
    }
  }, [schedule, position]);

  const validateTime = (start: string, end: string): boolean => {
    if (!start || !end) {
      setError("Заполните оба поля времени");
      return false;
    }

    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      setError("Время окончания должно быть позже времени начала");
      return false;
    }

    setError(null);
    return true;
  };

  const handleConfirm = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    
    if (!validateTime(startTime, endTime)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(startTime, endTime);
      // Закрываем модалку после успешного подтверждения
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении изменений");
      setIsLoading(false);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Если есть функция удаления, вызываем её (удаляем смену)
    if (onDelete) {
      setIsLoading(true);
      setError(null);
      
      try {
        await onDelete();
        // Закрываем модалку после успешного удаления
        onClose();
      } catch (err: any) {
        setError(err.message || "Ошибка при удалении смены");
        setIsLoading(false);
        // Не закрываем модалку при ошибке
      }
    } else {
      // Если функции удаления нет, просто закрываем модалку
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleConfirm(e as any);
    }
  };

  if (!schedule || !position) {
    return null;
  }

  const modalContent = (
    <div 
      className="confirm-schedule-modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        ref={modalRef}
        className="confirm-schedule-modal"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <p className="confirm-schedule-header">
          Рабочее время
        </p>
        
        <div className="confirm-schedule-time-inputs">
          <div className="time-input-wrapper">
            <label className="time-label">Начало</label>
            <select
              ref={startTimeRef}
              className="time-input"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setError(null);
              }}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          
          <span className="time-separator">-</span>
          
          <div className="time-input-wrapper">
            <label className="time-label">Окончание</label>
            <select
              className="time-input"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setError(null);
              }}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="confirm-schedule-error">
            {error}
          </div>
        )}

        <div className="confirm-schedule-actions">
          <button 
            className="confirm-schedule-cancel-btn" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Отменить
          </button>
          <button 
            className="confirm-schedule-btn" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Сохранение..." : "Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  );

  // Рендерим модалку через Portal вне структуры таблицы
  return createPortal(modalContent, document.body);
};

export default ConfirmScheduleModal;
