// src/pages/WorkSchedulePage.tsx

import React, { useEffect, useState } from "react"
import WorkScheduleHeader from "../components/WorkScheduleHeader.tsx"
import WorkScheduleTable from "../components/WorkScheduleTable.tsx"
import ScheduleSettingsSidebar from "../components/ScheduleSettingsSidebar.tsx"
import CreateUserModal from "../components/CreateUserModal.tsx"
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
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [coffeeShops, setCoffeeShops] = useState<any[]>([])

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

  const deleteSchedule = async (scheduleId: number) => {
    try {
      const res = await fetch(`/api/v1/schedule/delete_schedule/${scheduleId}`, {
        method: "DELETE",
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

      // Обновляем расписание после удаления
      await loadSchedule();
    } catch (e: any) {
      console.error("Ошибка удаления смены:", e);
      throw e;
    }
  };

  const saveSchedules = async (schedules: any[]) => {
    try {
      // Отправляем каждую смену отдельным запросом
      const promises = schedules.map(async (schedule, index) => {
        // Для роли 3 (бариста) всегда используем текущий user_id
        const scheduleData = role_id === 3 
          ? { ...schedule, user_id: user_id }
          : schedule;
        
        const res = await fetch("/api/v1/schedule/create_schedule", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(scheduleData)
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

  const loadCoffeeShops = async () => {
    try {
      const res = await fetch("/api/v1/coffee_shop/get_coffee_shops", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setCoffeeShops(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Ошибка загрузки кофеен:", e);
      setCoffeeShops([]);
    }
  };

  const createUser = async (userData: any) => {
    try {
      // Форматируем данные для отправки на бэкенд
      // Pydantic принимает hourly_rate как строку или число, конвертирует в Decimal
      // Если hourly_rate пустое, не отправляем поле вообще (или отправляем undefined)
      
      // Форматируем дату для бэкенда
      // Pydantic принимает ISO формат без временной зоны: YYYY-MM-DDTHH:mm:ss
      let formattedDate = userData.data_work_start;
      if (formattedDate) {
        try {
          // Если дата в формате YYYY-MM-DD, добавляем время 00:00:00
          if (typeof formattedDate === 'string' && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = `${formattedDate}T00:00:00`;
          } else {
            // Если дата уже в ISO формате, убираем временную зону и миллисекунды
            const dateObj = new Date(formattedDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
          }
        } catch (e) {
          console.error("Неверный формат даты:", formattedDate);
          throw new Error("Неверный формат даты начала работы");
        }
      }
      
      const formattedData: any = {
        first_name: userData.first_name.trim(),
        last_name: userData.last_name.trim(),
        patronymic: userData.patronymic ? userData.patronymic.trim() : null,
        email: userData.email.trim(),
        telephone: userData.telephone.trim(),
        role_id: Number(userData.role_id),
        coffee_shop_id: Number(userData.coffee_shop_id),
        assessment_rate: Number(userData.assessment_rate) || 0,
        work_experience: Number(userData.work_experience) || 0,
        hashed_password: userData.hashed_password,
        data_work_start: formattedDate
      };

      // Добавляем hourly_rate только если оно заполнено
      // Pydantic не принимает null для Decimal, поэтому не отправляем поле, если оно пустое
      if (userData.hourly_rate !== null && userData.hourly_rate !== undefined && userData.hourly_rate !== "") {
        const hourlyRateValue = typeof userData.hourly_rate === 'string' 
          ? userData.hourly_rate.trim()
          : String(userData.hourly_rate);
        if (hourlyRateValue !== "") {
          formattedData.hourly_rate = hourlyRateValue;
        }
      }

      // Логируем данные перед отправкой для отладки
      console.log("Отправляемые данные для создания пользователя:", formattedData);
      
      const res = await fetch("/api/v1/user/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formattedData)
      });

      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch (e) {
          // Если не удалось распарсить JSON, используем текст ответа
          const text = await res.text().catch(() => '');
          errorData = { detail: text || `Ошибка ${res.status}` };
        }
        
        // Обрабатываем детали ошибки валидации
        let errorMessage = `Ошибка ${res.status}`;
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors
            errorMessage = errorData.detail.map((err: any) => {
              const field = err.loc?.slice(1).join('.') || 'unknown';
              return `${field}: ${err.msg}`;
            }).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        console.error("Детали ошибки создания пользователя:", errorData);
        console.error("Отправленные данные:", formattedData);
        throw new Error(errorMessage);
      }

      // Обновляем список пользователей после создания
      await loadUsers();
    } catch (e: any) {
      console.error("Ошибка создания пользователя:", e);
      throw e;
    }
  };

  const createSchedule = async (date: Date, startTime: string, endTime: string, targetUserId?: number) => {
    try {
      const formatLocalDateTime = (date: Date, time: string): string => {
        const [hours, minutes] = time.split(":").map(Number);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      };

      // Для роли 3 используем текущий user_id, для ролей 1 и 2 - переданный targetUserId
      // Проверяем, что user_id валидный (не 0, не NaN, не null)
      const validUserId = user_id && user_id > 0 ? user_id : (user?.id || null);
      const scheduleUserId = role_id === 3 ? validUserId : (targetUserId || validUserId);
      
      if (!scheduleUserId || scheduleUserId <= 0) {
        throw new Error("Не удалось определить ID пользователя для создания смены");
      }
      
      // Определяем coffee_shop_id для целевого пользователя
      const targetUser = users.find(u => u.id === scheduleUserId);
      const scheduleCoffeeShopId = targetUser?.coffee_shop_id || user?.coffee_shop_id || null;

      const scheduleData = {
        user_id: scheduleUserId,
        coffee_shop_id: scheduleCoffeeShopId,
        status: "active",
        schedule_start_time: formatLocalDateTime(date, startTime),
        schedule_end_time: formatLocalDateTime(date, endTime),
        is_confirmed: false
      };

      const res = await fetch("/api/v1/schedule/create_schedule", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(scheduleData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Ошибка ${res.status}`;
        throw new Error(errorMessage);
      }

      // Обновляем расписание после создания
      await loadSchedule();
    } catch (e: any) {
      console.error("Ошибка создания смены:", e);
      throw e;
    }
  };


  useEffect(() => {
    loadUsers()
    loadSchedule()
    // Загружаем кофейни для выбора при создании пользователя (только для админа)
    if (role_id === 1) {
      loadCoffeeShops();
    }
    // Загружаем данные текущего пользователя для получения coffee_shop_id
    const loadCurrentUser = async () => {
      try {
        const res = await fetch("/api/v1/user/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Обновляем user_id в localStorage для актуальности
          if (userData.id) {
            localStorage.setItem("user_id", String(userData.id));
          }
        }
      } catch (e) {
        console.error("Ошибка загрузки пользователя:", e);
      }
    };
    loadCurrentUser();

    // Автоматическое обновление расписания каждые 5 секунд, чтобы видеть изменения от других пользователей
    const intervalId = setInterval(() => {
      loadSchedule();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <WorkScheduleHeader
            currentDate={currentDate}
            mode={mode}
            onPrev={prev}
            onNext={next}
            onModeChange={setMode}
            onSettingsClick={() => setIsSidebarOpen(true)}
            showSettings={true}
          />
          {role_id === 1 && (
            <button
              onClick={() => setIsCreateUserModalOpen(true)}
              style={{
                padding: "10px 20px",
                background: "#ff7b32",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "Montserrat, sans-serif"
              }}
            >
              + Добавить пользователя
            </button>
          )}
        </div>

        <WorkScheduleTable
          users={users}
          schedule={schedule}
          days={days}
          mode={mode}
          currentUserId={Number(localStorage.getItem("user_id")) || null}
          currentRoleId={role_id}
          onConfirmSchedule={confirmSchedule}
          onDeleteSchedule={deleteSchedule}
          onCreateSchedule={(date, startTime, endTime, targetUserId) => createSchedule(date, startTime, endTime, targetUserId)}
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

        {role_id === 1 && (
          <CreateUserModal
            isOpen={isCreateUserModalOpen}
            onClose={() => setIsCreateUserModalOpen(false)}
            onCreate={createUser}
            coffeeShops={coffeeShops}
          />
        )}
    </div>
  )
}

export default WorkSchedulePage
