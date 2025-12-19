import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/confirmScheduleModal.css";

interface AddScheduleModalProps {
  date: Date;
  position: { top: number; left: number } | null;
  onConfirm: (startTime: string, endTime: string) => Promise<void>;
  onClose: () => void;
  modalRef?: React.RefObject<HTMLDivElement | null>;
  initialStartTime?: string;
  initialEndTime?: string;
  onTimeChange?: (startTime: string, endTime: string) => void;
}

const AddScheduleModal: React.FC<AddScheduleModalProps> = ({ 
  date, 
  position, 
  onConfirm, 
  onClose,
  modalRef,
  initialStartTime = "09:00",
  initialEndTime = "21:00",
  onTimeChange
}) => {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
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

  // Функция для округления времени до ближайших 15 минут
  const roundTo15Minutes = (time: string): string => {
    if (!time) return time;
    const [hours, minutes] = time.split(":").map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const finalHours = hours + Math.floor(roundedMinutes / 60);
    const finalMinutes = roundedMinutes % 60;
    return `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`;
  };

  // Используем useRef для отслеживания предыдущих значений date и position
  const prevDateRef = useRef<Date | null>(null);
  const prevPositionRef = useRef<{ top: number; left: number } | null>(null);

  // Обновляем состояние времени только при первом открытии модалки (когда date или position меняются)
  useEffect(() => {
    if (date && position) {
      const dateChanged = prevDateRef.current?.getTime() !== date.getTime();
      const positionChanged = 
        prevPositionRef.current?.top !== position.top || 
        prevPositionRef.current?.left !== position.left;
      
      // Обновляем время только если модалка только что открылась (date или position изменились)
      if (dateChanged || positionChanged) {
        setStartTime(initialStartTime);
        setEndTime(initialEndTime);
        setError(null);
        // Фокус на первое поле при открытии
        setTimeout(() => {
          startTimeRef.current?.focus();
        }, 100);
      }
      
      prevDateRef.current = date;
      prevPositionRef.current = position;
    } else {
      // Когда модалка закрывается, сбрасываем предыдущие значения
      prevDateRef.current = null;
      prevPositionRef.current = null;
    }
  }, [date, position, initialStartTime, initialEndTime]);

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
      // Закрываем модалку после успешного создания
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка при создании смены");
      setIsLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleConfirm(e as any);
    }
  };

  if (!date) {
    return null;
  }
  
  // Если position не указан, используем центрирование по умолчанию
  const defaultPosition = position || { top: window.innerHeight / 2, left: window.innerWidth / 2 };

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
          top: position ? `${position.top}px` : '50%',
          left: position ? `${position.left}px` : '50%',
          transform: position ? 'translateX(-50%)' : 'translate(-50%, -50%)'
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
                if (onTimeChange) {
                  onTimeChange(e.target.value, endTime);
                }
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
                if (onTimeChange) {
                  onTimeChange(startTime, e.target.value);
                }
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
            {isLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );

  // Рендерим модалку через Portal вне структуры таблицы
  return createPortal(modalContent, document.body);
};

export default AddScheduleModal;
