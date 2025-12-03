import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/confirmScheduleModal.css";

interface ConfirmScheduleModalProps {
  schedule: any;
  position: { top: number; left: number } | null;
  onConfirm: (startTime: string, endTime: string) => Promise<void>;
  onClose: () => void;
  modalRef?: React.RefObject<HTMLDivElement | null>;
}

const ConfirmScheduleModal: React.FC<ConfirmScheduleModalProps> = ({ 
  schedule, 
  position, 
  onConfirm, 
  onClose,
  modalRef
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (schedule && position) {
      const start = new Date(schedule.schedule_start_time);
      const end = new Date(schedule.schedule_end_time);
      
      const formatTime = (d: Date) => {
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };
      
      setStartTime(formatTime(start));
      setEndTime(formatTime(end));
      setError(null);
      
      // Фокус на первое поле при открытии
      setTimeout(() => {
        startTimeRef.current?.focus();
      }, 100);
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
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении изменений");
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
                setStartTime(e.target.value);
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
                setEndTime(e.target.value);
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

export default ConfirmScheduleModal;
