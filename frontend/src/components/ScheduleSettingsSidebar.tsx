// src/components/ScheduleSettingsSidebar.tsx

import React, { useState, useEffect } from "react";
import * as Icons from "../icons/index.ts";

interface ScheduleSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedules: any[]) => Promise<void>;
  currentUserId: number | null;
  coffeeShopId: number | null;
  roleId: number;
  users: any[];
}

type TemplateType = "shifts" | "weekdays";
type StatusType = "active" | "выходной" | "vacation" | "больничный";

const WEEKDAYS = [
  { id: 1, label: "Пн", value: 1 },
  { id: 2, label: "Вт", value: 2 },
  { id: 3, label: "Ср", value: 3 },
  { id: 4, label: "Чт", value: 4 },
  { id: 5, label: "Пт", value: 5 },
  { id: 6, label: "Сб", value: 6 },
  { id: 0, label: "Вс", value: 0 },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Рабочий день", icon: <Icons.BriefcaseIcon /> },
  { value: "выходной", label: "Выходной", icon: <Icons.HouseIcon /> },
  { value: "vacation", label: "Отпуск", icon: <Icons.VacationIcon /> },
  { value: "больничный", label: "Больничный", icon: <Icons.MedicalIcon /> },
];

const ScheduleSettingsSidebar: React.FC<ScheduleSettingsSidebarProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUserId,
  coffeeShopId,
  roleId,
  users,
}) => {
  const [template, setTemplate] = useState<TemplateType>("weekdays");
  const [pattern, setPattern] = useState({ work: "2", rest: "2" });
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [interval, setInterval] = useState("4");
  const [status, setStatus] = useState<StatusType>("active");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isStartTimeDropdownOpen, setIsStartTimeDropdownOpen] = useState(false);
  const [isEndTimeDropdownOpen, setIsEndTimeDropdownOpen] = useState(false);
  
  // Определяем, показывать ли поле выбора сотрудника (только для админа и менеджера)
  const showEmployeeSelect = roleId === 1 || roleId === 2;
  
  // Определяем ID пользователя для создания смены
  const targetUserId = showEmployeeSelect && selectedEmployeeId ? selectedEmployeeId : currentUserId;
  
  // Определяем coffee_shop_id для выбранного сотрудника
  const targetCoffeeShopId = showEmployeeSelect && selectedEmployeeId
    ? users.find(u => u.id === selectedEmployeeId)?.coffee_shop_id || coffeeShopId
    : coffeeShopId;

  // Генерация времени с шагом 15 минут
  const generateTimeOptions = () => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      setTemplate("weekdays");
      setPattern({ work: "2", rest: "2" });
      setSelectedDays([]);
      setInterval("4");
      setStatus("active");
      setStartTime("09:00");
      setEndTime("21:00");
      setIsDropdownOpen(false);
      setIsStatusDropdownOpen(false);
      setSelectedEmployeeId(null);
      setIsEmployeeDropdownOpen(false);
      setIsStartTimeDropdownOpen(false);
      setIsEndTimeDropdownOpen(false);
    }
  }, [isOpen]);
  
  // Устанавливаем текущего пользователя по умолчанию при открытии для админа/менеджера
  useEffect(() => {
    if (isOpen && showEmployeeSelect && !selectedEmployeeId && currentUserId) {
      setSelectedEmployeeId(currentUserId);
    }
  }, [isOpen, showEmployeeSelect, selectedEmployeeId, currentUserId]);

  const handleDayToggle = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handlePatternChange = (field: "work" | "rest", value: string) => {
    if (/^\d*$/.test(value)) {
      setPattern((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (template === "weekdays") {
      if (selectedDays.length === 0) {
        alert("Выберите хотя бы один рабочий день");
        return false;
      }
    } else {
      const workDays = parseInt(pattern.work);
      const restDays = parseInt(pattern.rest);
      if (!workDays || !restDays || workDays < 1 || restDays < 1) {
        alert("Введите корректный паттерн (например: 2/2)");
        return false;
      }
    }

    if (!interval || parseInt(interval) < 1) {
      alert("Введите корректный интервал действия");
      return false;
    }

    if (!startTime || !endTime) {
      alert("Выберите время работы");
      return false;
    }

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      alert("Время окончания должно быть позже времени начала");
      return false;
    }

    return true;
  };

  // Форматируем дату в локальном времени без временной зоны (YYYY-MM-DDTHH:mm:ss)
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const generateSchedules = (): any[] => {
    if (!targetUserId) {
      console.error("targetUserId не установлен");
      return [];
    }
    
    if (!targetCoffeeShopId) {
      console.error("targetCoffeeShopId не установлен");
      return [];
    }

    const schedules: any[] = [];
    const weeks = parseInt(interval) || 4;
    const totalDays = weeks * 7;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (template === "weekdays") {
      // Генерация по дням недели
      for (let day = 0; day < totalDays; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        const dayOfWeek = currentDate.getDay();

        if (selectedDays.includes(dayOfWeek)) {
          const [startHour, startMin] = startTime.split(":").map(Number);
          const [endHour, endMin] = endTime.split(":").map(Number);

          const scheduleStart = new Date(currentDate);
          scheduleStart.setHours(startHour, startMin, 0, 0);

          const scheduleEnd = new Date(currentDate);
          scheduleEnd.setHours(endHour, endMin, 0, 0);

          schedules.push({
            user_id: targetUserId,
            coffee_shop_id: targetCoffeeShopId,
            status: status,
            schedule_start_time: formatLocalDateTime(scheduleStart),
            schedule_end_time: formatLocalDateTime(scheduleEnd),
            is_confirmed: false,
          });
        }
      }
    } else {
      // Генерация по паттерну (например, 2/2 означает 2 рабочих дня, 2 выходных)
      const workDays = parseInt(pattern.work);
      const restDays = parseInt(pattern.rest);
      let dayCounter = 0;

      for (let day = 0; day < totalDays; day++) {
        const positionInCycle = dayCounter % (workDays + restDays);
        const isWorkDay = positionInCycle < workDays;

        if (isWorkDay) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + day);

          const [startHour, startMin] = startTime.split(":").map(Number);
          const [endHour, endMin] = endTime.split(":").map(Number);

          const scheduleStart = new Date(currentDate);
          scheduleStart.setHours(startHour, startMin, 0, 0);

          const scheduleEnd = new Date(currentDate);
          scheduleEnd.setHours(endHour, endMin, 0, 0);

          schedules.push({
            user_id: targetUserId,
            coffee_shop_id: targetCoffeeShopId,
            status: status,
            schedule_start_time: formatLocalDateTime(scheduleStart),
            schedule_end_time: formatLocalDateTime(scheduleEnd),
            is_confirmed: false,
          });
        }

        dayCounter++;
      }
    }

    return schedules;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (showEmployeeSelect && !selectedEmployeeId) {
      alert("Ошибка: выберите сотрудника для создания смены");
      return;
    }

    if (!targetUserId) {
      alert("Ошибка: не удалось определить ID пользователя");
      return;
    }

    if (!targetCoffeeShopId) {
      const employeeName = showEmployeeSelect && selectedEmployeeId
        ? users.find(u => u.id === selectedEmployeeId)?.last_name || "выбранный сотрудник"
        : "вы";
      alert(`Ошибка: не удалось определить ID кофейни для ${employeeName}. Проверьте, что ${showEmployeeSelect ? "сотрудник" : "вы"} привязан к кофейне.`);
      return;
    }

    const schedules = generateSchedules();
    if (schedules.length === 0) {
      alert("Не удалось сгенерировать смены. Проверьте настройки:\n- Выберите дни недели (для шаблона 'По дням недели')\n- Проверьте паттерн (для шаблона 'По сменам')");
      return;
    }

    try {
      await onSave(schedules);
      alert("График успешно сохранен!");
      onClose();
    } catch (error: any) {
      console.error("Ошибка сохранения графика:", error);
      const errorMessage = error?.message || "Ошибка при сохранении графика";
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const selectedStatus = STATUS_OPTIONS.find((opt) => opt.value === status);
  const selectedEmployee = selectedEmployeeId ? users.find(u => u.id === selectedEmployeeId) : null;
  const selectedEmployeeName = selectedEmployee
    ? `${selectedEmployee.last_name || ""} ${selectedEmployee.first_name || ""} ${selectedEmployee.patronymic || ""}`.trim()
    : "Выберите сотрудника";

  return (
    <>
      <div className="sidebar-overlay" onClick={handleCancel} />
      <div className="schedule-settings-sidebar">
        <h2 className="sidebar-title">Настройки графика</h2>

        {/* Выбор шаблона */}
        <div className="settings-section">
          <label className="settings-label">Выбор шаблона</label>
          <div className="dropdown-wrapper">
            <button
              className="dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {template === "weekdays" ? "По дням недели" : "По сменам"}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setTemplate("weekdays");
                    setIsDropdownOpen(false);
                  }}
                >
                  По дням недели
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setTemplate("shifts");
                    setIsDropdownOpen(false);
                  }}
                >
                  По сменам
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Динамические настройки */}
        <div className="settings-dynamic">
          {template === "weekdays" ? (
            <>
              {/* Выбор дней недели */}
              <div className="settings-section">
                <label className="settings-label">Рабочие дни</label>
                <div className="weekdays-checkboxes">
                  {WEEKDAYS.map((day) => (
                    <label key={day.id} className="weekday-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day.value)}
                        onChange={() => handleDayToggle(day.value)}
                      />
                      <span className="weekday-label">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Паттерн рабочих/выходных дней */}
              <div className="settings-section">
                <label className="settings-label">Паттерн рабочих/выходных дней</label>
                <div className="pattern-input">
                  <input
                    type="text"
                    value={pattern.work}
                    onChange={(e) => handlePatternChange("work", e.target.value)}
                    className="pattern-field"
                    placeholder="2"
                  />
                  <span>/</span>
                  <input
                    type="text"
                    value={pattern.rest}
                    onChange={(e) => handlePatternChange("rest", e.target.value)}
                    className="pattern-field"
                    placeholder="2"
                  />
                </div>
              </div>
            </>
          )}

          {/* Интервал действия */}
          <div className="settings-section">
            <label className="settings-label">Интервал действия</label>
            <div className="interval-input">
              <input
                type="number"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                min="1"
                className="interval-field"
              />
              <span>недели</span>
            </div>
          </div>

          {/* Тип действия */}
          <div className="settings-section">
            <label className="settings-label">Тип</label>
            <div className="dropdown-wrapper">
              <button
                className="dropdown-button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              >
                {selectedStatus && (
                  <>
                    <span className="status-icon">{selectedStatus.icon}</span>
                    <span>{selectedStatus.label}</span>
                  </>
                )}
                <span className="dropdown-arrow">▼</span>
              </button>
              {isStatusDropdownOpen && (
                <div className="dropdown-menu">
                  {STATUS_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="dropdown-item"
                      onClick={() => {
                        setStatus(option.value as StatusType);
                        setIsStatusDropdownOpen(false);
                      }}
                    >
                      <span className="status-icon">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Рабочее время */}
          <div className="settings-section">
            <label className="settings-label">Рабочее время</label>
            <div className="time-inputs">
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="time-select"
                style={{ 
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none'
                }}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <span>-</span>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="time-select"
                style={{ 
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none'
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
          {/* Выбор сотрудника (только для админа и менеджера) - перед кнопками */}
        {showEmployeeSelect && (
          <div className="settings-section">
            <label className="settings-label">Сотрудник</label>
            <div className="dropdown-wrapper">
              <button
                className="dropdown-button"
                onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
              >
                <span>{selectedEmployeeName}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {isEmployeeDropdownOpen && (
                <div className="dropdown-menu">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="dropdown-item"
                      onClick={() => {
                        setSelectedEmployeeId(user.id);
                        setIsEmployeeDropdownOpen(false);
                      }}
                    >
                      {user.last_name} {user.first_name} {user.patronymic || ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        </div>

        {/* Кнопки управления */}
        <div className="sidebar-actions">
          <button className="cancel-button" onClick={handleCancel}>
            Отменить
          </button>
          <button className="save-button" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
};

export default ScheduleSettingsSidebar;

