// src/pages/WorkSchedulePage.tsx

import React, { useEffect, useState } from "react"
import WorkScheduleHeader from "../components/WorkScheduleHeader.tsx"
import WorkScheduleTable from "../components/WorkScheduleTable.tsx"
import ScheduleSettingsSidebar from "../components/ScheduleSettingsSidebar.tsx"
import { DayData, generateWeekDays, generateMonthDays } from "../components/useScheduleUtils.tsx"
import "../styles/workSchedulePage.css"
import * as Icons from "../icons/index.ts"
import { useNavigate, useLocation } from "react-router-dom";

const WorkSchedulePage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [user, setUser] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mode, setMode] = useState<"week" | "month">("month")
  const [days, setDays] = useState<DayData[]>([]);
  const [shouldLogout, setShouldLogout] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const token = localStorage.getItem("token")
  const role_id = Number(localStorage.getItem("role_id"));
  const user_id = Number(localStorage.getItem("user_id"));

  const loadUsers = async () => {
  try {
    const res = await fetch("/api/v1/user/all_users", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    // Если API вернул ошибку — игнорируем
    if (!res.ok || !Array.isArray(data)) {
      console.warn("Некорректный ответ /all_users:", data);
      setUsers([]);
      return;
    }

    setUsers(data);
  } catch (e) {
    console.error("Ошибка /all_users:", e);
    setUsers([]);
  }
};


  const loadSchedule = async () => {
  try {
    const res = await fetch("/api/v1/schedule/get_all_schedule", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      console.warn("Некорректный ответ /schedule:", data);
      setSchedule([]);
      return;
    }

    setSchedule(data);
  } catch (e) {
    console.error("Ошибка /schedule:", e);
    setSchedule([]);
  }
};

  const confirmSchedule = async (scheduleId: number, startTime?: string, endTime?: string) => {
    try {
      // Форматируем время для отправки на сервер
      let schedule_start_time: string | undefined;
      let schedule_end_time: string | undefined;

      if (startTime && endTime) {
        // Получаем дату из существующей смены для сохранения даты
        const existingSchedule = schedule.find((s: any) => s.id === scheduleId);
        if (existingSchedule) {
          const scheduleDate = new Date(existingSchedule.schedule_start_time);
          const [startHour, startMin] = startTime.split(":").map(Number);
          const [endHour, endMin] = endTime.split(":").map(Number);

          const startDateTime = new Date(scheduleDate);
          startDateTime.setHours(startHour, startMin, 0, 0);

          const endDateTime = new Date(scheduleDate);
          endDateTime.setHours(endHour, endMin, 0, 0);

          // Форматируем в локальное время без временной зоны
          const formatLocalDateTime = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
          };

          schedule_start_time = formatLocalDateTime(startDateTime);
          schedule_end_time = formatLocalDateTime(endDateTime);
        }
      }

      // Формируем URL с параметрами
      const params = new URLSearchParams();
      params.append("is_confirmed", "true");
      if (schedule_start_time) {
        params.append("schedule_start_time", schedule_start_time);
      }
      if (schedule_end_time) {
        params.append("schedule_end_time", schedule_end_time);
      }

      const res = await fetch(`/api/v1/schedule/${scheduleId}/confirm?${params.toString()}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Ошибка ${res.status}`;
        throw new Error(errorMessage);
      }

      // Обновляем расписание после подтверждения
      await loadSchedule();
    } catch (e: any) {
      console.error("Ошибка подтверждения смены:", e);
      throw e;
    }
  };

  const saveSchedules = async (schedules: any[]) => {
    try {
      // Отправляем каждую смену отдельным запросом
      const promises = schedules.map(async (schedule, index) => {
        const res = await fetch("/api/v1/schedule/create_schedule", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(schedule)
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error(`Ошибка создания смены ${index + 1}:`, res.status, errorData);
          return { success: false, error: errorData.detail || `Ошибка ${res.status}`, index };
        }
        
        return { success: true, index };
      });

      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.success);
      
      if (errors.length > 0) {
        const errorMessages = errors.map(e => `Смена ${e.index + 1}: ${e.error}`).join("\n");
        throw new Error(`Ошибка создания ${errors.length} из ${schedules.length} смен:\n${errorMessages}`);
      }

      // Обновляем расписание после сохранения
      await loadSchedule();
    } catch (e) {
      console.error("Ошибка сохранения графика:", e);
      throw e;
    }
  };


  useEffect(() => {
    loadUsers()
    loadSchedule()
    // Загружаем данные текущего пользователя для получения coffee_shop_id
    const loadCurrentUser = async () => {
      try {
        const res = await fetch("/api/v1/user/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (e) {
        console.error("Ошибка загрузки пользователя:", e);
      }
    };
    loadCurrentUser();
  }, [])

  useEffect(() => {
    const d = mode === "week" ? generateWeekDays(currentDate) : generateMonthDays(currentDate)
    setDays(d)
  }, [mode, currentDate])

  const prev = () => {
    const d = new Date(currentDate)
    if (mode === "week") d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setCurrentDate(d)
  }

  const next = () => {
    const d = new Date(currentDate)
    if (mode === "week") d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setCurrentDate(d)
  }

  const navigate = useNavigate();

    useEffect(() => {
      if (shouldLogout) {
        localStorage.removeItem("token");
        navigate("/");
      }
    }, [shouldLogout, navigate]);
  
    const handleLogout = () => setShouldLogout(true);
    const handleGoToProfile = () => navigate("/profile"); 

  const { pathname } = useLocation();
  const scheduleActive = pathname.startsWith("/schedule");
  const reportActive = pathname.startsWith("/report") || pathname.startsWith("/profile/report");

  return (
    <div className="work-schedule-page">
      {/* Верхняя панель */}
            <header className="profile-header">
              <Icons.LogoIcon className="logo" title="logo" />
              {(role_id === 1 || role_id === 2) && (
                <div className="manager-controls">
                  <div className="nav-buttons">
                    <button className={`link-btn ${scheduleActive ? "active" : ""}`} onClick={() => navigate("/schedule")}>График работы</button>
                    <button className={`link-btn ${reportActive ? "active" : ""}`} onClick={() => navigate("/report")}>Отчёт</button>
                  </div>
                </div>
              )}
              <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти" />
            </header>
      <div className="container-page">
        <WorkScheduleHeader
          currentDate={currentDate}
          mode={mode}
          onPrev={prev}
          onNext={next}
          onModeChange={setMode}
          onSettingsClick={() => setIsSidebarOpen(true)}
          showSettings={true}
        />

        <WorkScheduleTable
          users={users}
          schedule={schedule}
          days={days}
          mode={mode}
          currentUserId={Number(localStorage.getItem("user_id")) || null}
          currentRoleId={role_id}
          onConfirmSchedule={confirmSchedule}
        />
        </div>
        
        <ScheduleSettingsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSave={saveSchedules}
          currentUserId={user_id}
          coffeeShopId={user?.coffee_shop_id || null}
          roleId={role_id}
          users={users}
        />
    </div>
  )
}

export default WorkSchedulePage
