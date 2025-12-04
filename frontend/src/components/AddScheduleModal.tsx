import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/confirmScheduleModal.css";

interface AddScheduleModalProps {
  date: Date;
  position: { top: number; left: number } | null;
  onConfirm: (startTime: string, endTime: string) => Promise<void>;
  onClose: () => void;
  modalRef?: React.RefObject<HTMLDivElement | null>;
}

const AddScheduleModal: React.FC<AddScheduleModalProps> = ({ 
  date, 
  position, 
  onConfirm, 
  onClose,
  modalRef
}) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);

  // Функция для округления времени до ближайших 15 минут
  const roundTo15Minutes = (time: string): string => {
    if (!time) return time;
    const [hours, minutes] = time.split(":").map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const finalHours = hours + Math.floor(roundedMinutes / 60);
    const finalMinutes = roundedMinutes % 60;
    return `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (date && position) {
      setError(null);
      // Фокус на первое поле при открытии
      setTimeout(() => {
        startTimeRef.current?.focus();
      }, 100);
    }
  }, [date, position]);

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
            <input
              ref={startTimeRef}
              type="time"
              className="time-input"
              value={startTime}
              onChange={(e) => {
                const rounded = roundTo15Minutes(e.target.value);
                setStartTime(rounded);
                setError(null);
              }}
              step="900"
              min="00:00"
              max="23:45"
            />
          </div>
          
          <span className="time-separator">-</span>
          
          <div className="time-input-wrapper">
            <label className="time-label">Окончание</label>
            <input
              type="time"
              className="time-input"
              value={endTime}
              onChange={(e) => {
                const rounded = roundTo15Minutes(e.target.value);
                setEndTime(rounded);
                setError(null);
              }}
              step="900"
              min="00:00"
              max="23:45"
            />
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

export default AddScheduleModal;
