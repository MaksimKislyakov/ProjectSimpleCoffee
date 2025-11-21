import React, { useState } from "react";
import "../styles/addScheduleModal.css";

interface AddScheduleModalProps {
  date: Date | null;
  onClose: () => void;
  onSubmit: (data: {
    schedule_start_time: string;
    schedule_end_time: string;
    status: string;
    comment: string;
  }) => void;
}

const AddScheduleModal: React.FC<AddScheduleModalProps> = ({ date, onClose, onSubmit }) => {

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("active");
  const [comment, setComment] = useState("");

  if (!date) {
    return null; // теперь return после хуков — это разрешено
  }

  const formatLocalDateTime = (date: Date, time: string) => {
  const [h, m] = time.split(":");
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}T${h}:${m}:00`;
};

  const handleSubmit = () => {
    if (!startTime || !endTime) return;

    const schedule_start_time = formatLocalDateTime(date, startTime);
    const schedule_end_time = formatLocalDateTime(date, endTime);

    onSubmit({
      status,
      schedule_start_time,
      schedule_end_time,
      comment
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-window">
            <h2>Добавить расписание</h2>
            <p>Дата: {date.toLocaleDateString()}</p>
        </div>

        <div className="time-row">
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            -
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>

        {/*<label>
          Статус:
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="active">Рабочий день</option>
            <option value="vacation">Отпуск</option>
            <option value="sick">Больничный</option>
          </select>
        </label>*/}

        <label>
          <input 
          className="comment"
          type="text"
          placeholder="Комментарий"
          value={comment} 
          onChange={e => setComment(e.target.value)} />
        </label>

        <button className="save" onClick={handleSubmit}>Сохранить</button>
        <button className="cancel" onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
};

export default AddScheduleModal;
