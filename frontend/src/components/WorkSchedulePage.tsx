// src/pages/WorkSchedulePage.tsx

import React, { useEffect, useState, useRef } from "react"
import WorkScheduleHeader from "../components/WorkScheduleHeader.tsx"
import WorkScheduleTable from "../components/WorkScheduleTable.tsx"
import ScheduleSettingsSidebar from "../components/ScheduleSettingsSidebar.tsx"
import CoffeeShopSelector from "../components/CoffeeShopSelector.tsx"
import ReportDateRangePicker from "../components/ReportDateRangePicker.tsx"
import { DayData, generateWeekDays, generateMonthDays, generateTwoWeeks } from "../components/useScheduleUtils.tsx"
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 394)
  const calendarButtonRef = useRef<HTMLDivElement>(null)
  const [coffeeShops, setCoffeeShops] = useState<any[]>([])
  const [coffeeShopAddress, setCoffeeShopAddress] = useState<string>("")
  const [selectedCoffeeShopId, setSelectedCoffeeShopId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedCoffeeShopId");
    return saved ? parseInt(saved, 10) : null;
  });

  const token = localStorage.getItem("token")
  const role_id = Number(localStorage.getItem("role_id"));
  const user_id = Number(localStorage.getItem("user_id"));

  // Обработчик изменения филиала
  const handleCoffeeShopChange = (shopId: number) => {
    setSelectedCoffeeShopId(shopId);
    localStorage.setItem("selectedCoffeeShopId", shopId.toString());
    
    // Обновляем адрес кофейни
    const shop = coffeeShops.find((s: any) => s.id === shopId);
    if (shop && shop.adress) {
      setCoffeeShopAddress(shop.adress);
    }
    
    // Перезагружаем данные
    loadUsers();
    loadSchedule();
  };

  const loadUsers = async () => {
    const shopId = selectedCoffeeShopId;
  try {
    const res = await fetch("http://localhost:8000/api/v1/user/all_users", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    // Если API вернул ошибку — игнорируем
    if (!res.ok || !Array.isArray(data)) {
      setUsers([]);
      return;
    }

    // Фильтруем пользователей по выбранному филиалу, если он выбран
    const filteredUsers = shopId 
      ? data.filter((u: any) => u.coffee_shop_id === shopId)
      : data;

    setUsers(filteredUsers);
  } catch (e) {
    setUsers([]);
  }
};


  const loadSchedule = async () => {
  try {
    const res = await fetch("http://localhost:8000/api/v1/schedule/get_all_schedule", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      setSchedule([]);
      return;
    }

    setSchedule(data);
  } catch (e) {
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

      const res = await fetch(`http://localhost:8000/api/v1/schedule/${scheduleId}/confirm?${params.toString()}`, {
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
      throw e;
    }
  };

  const deleteSchedule = async (scheduleId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/schedule/delete_schedule/${scheduleId}`, {
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
        
        const res = await fetch("http://localhost:8000/api/v1/schedule/create_schedule", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(scheduleData)
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
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
      throw e;
    }
  };

  const loadCoffeeShops = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/coffee_shop/get_coffee_shops", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setCoffeeShops(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setCoffeeShops([]);
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
        status: "Рабочая смена",
        schedule_start_time: formatLocalDateTime(date, startTime),
        schedule_end_time: formatLocalDateTime(date, endTime),
        is_confirmed: false
      };

      const res = await fetch("http://localhost:8000/api/v1/schedule/create_schedule", {
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
        const res = await fetch("http://localhost:8000/api/v1/user/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Обновляем user_id в localStorage для актуальности
          if (userData.id) {
            localStorage.setItem("user_id", String(userData.id));
          }
          
          // Загружаем адрес кофейни
          if (userData.coffee_shop_id) {
            // Для роли 3 (сотрудник) не вызываем API, который требует прав админа/менеджера
            if (role_id === 3) {
              // Устанавливаем филиал пользователя
              if (userData.coffee_shop_id && userData.coffee_shop_id !== selectedCoffeeShopId) {
                setSelectedCoffeeShopId(userData.coffee_shop_id);
                localStorage.setItem("selectedCoffeeShopId", userData.coffee_shop_id.toString());
              }
              // Для роли 3 показываем просто "Филиал" без адреса, так как нет доступа к API
              setCoffeeShopAddress("Филиал");
            } else {
              // Для ролей 1 и 2 загружаем список кофеен
              try {
                const coffeeShopRes = await fetch("http://localhost:8000/api/v1/coffee_shop/get_coffee_shops", {
                  headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (coffeeShopRes.ok) {
                  const coffeeShopsData = await coffeeShopRes.json();
                  // Устанавливаем выбранный филиал из localStorage или используем филиал пользователя
                  const currentSelectedId = selectedCoffeeShopId || (() => {
                    const saved = localStorage.getItem("selectedCoffeeShopId");
                    return saved ? parseInt(saved, 10) : null;
                  })();
                  const shopIdToUse = currentSelectedId || userData.coffee_shop_id;
                  if (shopIdToUse && shopIdToUse !== selectedCoffeeShopId) {
                    setSelectedCoffeeShopId(shopIdToUse);
                    localStorage.setItem("selectedCoffeeShopId", shopIdToUse.toString());
                  }
                  
                  const shopId = shopIdToUse || userData.coffee_shop_id;
                  const shop = Array.isArray(coffeeShopsData) 
                    ? coffeeShopsData.find((s: any) => s.id === shopId)
                    : null;
                  if (shop && shop.adress) {
                    setCoffeeShopAddress(shop.adress);
                  }
                }
              } catch (err) {
              }
            }
          }
        }
      } catch (e) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoffeeShopId])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 394);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let d: DayData[];
    if (isMobile) {
      // В мобильной версии всегда используем 2 недели, начинающиеся со среды
      d = generateTwoWeeks(currentDate);
    } else {
      // В веб-версии используем неделю или месяц в зависимости от режима
      d = mode === "week" ? generateWeekDays(currentDate) : generateMonthDays(currentDate);
    }
    setDays(d);
  }, [mode, currentDate, isMobile])

  // Функция для вычисления месяца, который отображается на кнопке календаря
  const getDisplayMonthDate = (date: Date): Date => {
    // Вычисляем начало двух недель (среда)
    const start = new Date(date);
    const dayOfWeek = date.getDay();
    let offsetToWednesday: number;
    
    if (dayOfWeek === 0) offsetToWednesday = -4;
    else if (dayOfWeek === 1) offsetToWednesday = -5;
    else if (dayOfWeek === 2) offsetToWednesday = -6;
    else if (dayOfWeek === 3) offsetToWednesday = 0;
    else if (dayOfWeek === 4) offsetToWednesday = -1;
    else if (dayOfWeek === 5) offsetToWednesday = -2;
    else offsetToWednesday = -3;
    
    start.setDate(date.getDate() + offsetToWednesday);
    const end = new Date(start);
    end.setDate(start.getDate() + 13);
    
    // Если период охватывает два месяца, показываем следующий месяц (endMonth)
    // Иначе показываем startMonth
    if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
      return new Date(end.getFullYear(), end.getMonth(), 1);
    }
    return new Date(start.getFullYear(), start.getMonth(), 1);
  };

  // Обработчик изменения даты через календарь (для мобильной версии)
  const handleScheduleDateChange = (startDate: Date, endDate: Date) => {
    // Выравниваем выбранную дату на среду начала двухнедельного периода
    // Неделя: Ср, Чт, Пт, Сб, Вс, Пн, Вт
    const selectedDate = new Date(startDate);
    const dayOfWeek = selectedDate.getDay();
    let wednesdayOffset: number;
    
    if (dayOfWeek === 0) { // Воскресенье - идем к среде 4 дня назад
      wednesdayOffset = -4;
    } else if (dayOfWeek === 1) { // Понедельник - идем к среде 5 дней назад (прошлая неделя)
      wednesdayOffset = -5;
    } else if (dayOfWeek === 2) { // Вторник - идем к среде 6 дней назад (прошлая неделя)
      wednesdayOffset = -6;
    } else if (dayOfWeek === 3) { // Среда - начало недели
      wednesdayOffset = 0;
    } else if (dayOfWeek === 4) { // Четверг - идем к среде 1 день назад
      wednesdayOffset = -1;
    } else if (dayOfWeek === 5) { // Пятница - идем к среде 2 дня назад
      wednesdayOffset = -2;
    } else { // Суббота (6) - идем к среде 3 дня назад
      wednesdayOffset = -3;
    }
    
    selectedDate.setDate(selectedDate.getDate() + wednesdayOffset);
    setCurrentDate(selectedDate);
  };

  const prev = () => {
    const d = new Date(currentDate)
    if (mode === "week") {
      // Находим среду текущей недели
      const dayOfWeek = d.getDay();
      let offsetToWednesday: number;
      
      if (dayOfWeek === 0) offsetToWednesday = -4;
      else if (dayOfWeek === 1) offsetToWednesday = -5;
      else if (dayOfWeek === 2) offsetToWednesday = -6;
      else if (dayOfWeek === 3) offsetToWednesday = 0;
      else if (dayOfWeek === 4) offsetToWednesday = -1;
      else if (dayOfWeek === 5) offsetToWednesday = -2;
      else offsetToWednesday = -3;
      
      // Устанавливаем на среду текущей недели
      d.setDate(d.getDate() + offsetToWednesday);
      // Переходим на предыдущую неделю (вычитаем 7 дней)
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1)
    }
    setCurrentDate(d)
  }

  const next = () => {
    const d = new Date(currentDate)
    if (mode === "week") {
      // Находим среду текущей недели
      const dayOfWeek = d.getDay();
      let offsetToWednesday: number;
      
      if (dayOfWeek === 0) offsetToWednesday = -4;
      else if (dayOfWeek === 1) offsetToWednesday = -5;
      else if (dayOfWeek === 2) offsetToWednesday = -6;
      else if (dayOfWeek === 3) offsetToWednesday = 0;
      else if (dayOfWeek === 4) offsetToWednesday = -1;
      else if (dayOfWeek === 5) offsetToWednesday = -2;
      else offsetToWednesday = -3;
      
      // Устанавливаем на среду текущей недели
      d.setDate(d.getDate() + offsetToWednesday);
      // Переходим на следующую неделю (добавляем 7 дней)
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1)
    }
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

  const { pathname } = useLocation();
  const scheduleActive = pathname.startsWith("/schedule");
  const reportActive = pathname.startsWith("/report") || pathname.startsWith("/profile/report");

  // Преобразование role_id в текст
  const getRoleText = (roleId: number): string => {
    switch (roleId) {
      case 1:
        return "Администратор";
      case 2:
        return "Менеджер";
      case 3:
        return "Бариста";
      default:
        return "Неизвестно";
    }
  };

  // Форматирование имени в формате "Имя Фамилия И." (сокращенная фамилия) для мобильной версии
  const getShortNameMobile = (firstName: string, lastName: string, patronymic: string): string => {
    if (!firstName) return "";
    
    const patronymicInitial = patronymic ? patronymic.charAt(0).toUpperCase() + "." : "";
    
    // Если фамилия отсутствует или совпадает с именем, не добавляем её
    if (!lastName || lastName.trim() === "" || lastName.toLowerCase() === firstName.toLowerCase()) {
      return patronymicInitial ? `${firstName} ${patronymicInitial}`.trim() : firstName;
    }
    
    // Сокращаем фамилию до первой буквы, если она длинная
    const shortLastName = lastName.length > 8 
      ? lastName.charAt(0).toUpperCase() + "." 
      : lastName;
    
    return `${firstName} ${shortLastName} ${patronymicInitial}`.trim();
  };

  return (
    <div className="work-schedule-page">
      {/* Верхняя панель - Десктоп */}
            <header className="profile-header desktop-header">
              <div className="desktop-header-left">
                <Icons.LogoIcon className="logo" title="logo" />
                {user && (
                  <span style={{ 
                    color: "#3F3932", 
                    fontFamily: "Montserrat",
                    fontWeight: 600,
                    fontSize: "20px",
                    lineHeight: "100%",
                    letterSpacing: "0%",
                    marginRight: "16px"
                  }}>
                    {getRoleText(user.role_id)} - {getShortNameMobile(user.first_name, user.last_name || "", user.patronymic || "")}
                  </span>
                )}
                {/* Выпадающий список филиалов для ролей 1 и 2 */}
                {(role_id === 1 || role_id === 2) ? (
                  <CoffeeShopSelector
                    selectedShopId={selectedCoffeeShopId}
                    onShopChange={handleCoffeeShopChange}
                    roleId={role_id}
                  />
                ) : (
                  coffeeShopAddress && (
                    <span className="desktop-coffee-shop-address">{coffeeShopAddress}</span>
                  )
                )}
              </div>
              <div className="desktop-header-right">
                {(role_id === 1 || role_id === 2) && (
                  <div className="manager-controls">
                    <div className="nav-buttons">
                      <button className={`link-btn ${scheduleActive ? "active" : ""}`} onClick={() => navigate("/schedule")}>График работы</button>
                      <button className={`link-btn ${reportActive ? "active" : ""}`} onClick={() => navigate("/report")}>Отчёт</button>
                    </div>
                  </div>
                )}
                <Icons.NotificationIcon className="notifications-icon" title="Уведомления" style={{ cursor: "pointer" }} />
                <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти" />
              </div>
            </header>

      {/* Мобильный хедер */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <Icons.LogoIcon className="mobile-logo" title="logo" />
          {user && (
            <span style={{ 
              color: "#3F3932", 
              fontFamily: "Montserrat",
              fontWeight: 600,
              fontSize: "20px",
              lineHeight: "100%",
              letterSpacing: "0%",
              marginRight: "12px"
            }}>
              {getRoleText(user.role_id)} - {getShortNameMobile(user.first_name, user.last_name || "", user.patronymic || "")}
            </span>
          )}
          {/* Выпадающий список филиалов для ролей 1 и 2 */}
          {(role_id === 1 || role_id === 2) ? (
            <CoffeeShopSelector
              selectedShopId={selectedCoffeeShopId}
              onShopChange={handleCoffeeShopChange}
              roleId={role_id}
            />
          ) : (
            coffeeShopAddress && (
              <span className="mobile-coffee-shop-address">{coffeeShopAddress}</span>
            )
          )}
        </div>
        <div className="mobile-header-right">
          <Icons.NotificationIcon className="mobile-notifications-icon" title="Уведомления" style={{ cursor: "pointer" }} />
          <Icons.ExitIcon className="mobile-logout-icon" onClick={handleLogout} title="Выйти" />
        </div>
      </header>

      {/* Блок информации о сотруднике - Мобильная версия */}
      {user && (
        <div className="mobile-employee-info">
          <div className="mobile-employee-avatar">
            {/* Аватарка пользователя в виде круга */}
            <div className="avatar-circle">
              {user.first_name ? user.first_name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
          <div className="mobile-employee-details">
            <span className="mobile-employee-role">{getRoleText(user.role_id)}</span>
            <span className="mobile-employee-name">
              {getShortNameMobile(user.first_name, user.last_name || "", user.patronymic || "")}
            </span>
          </div>
        </div>
      )}
      <div className="container-page">
        <div style={{ display: "flex", alignItems: "center"}}>
          <WorkScheduleHeader
            currentDate={currentDate}
            mode={mode}
            onPrev={prev}
            onNext={next}
            onModeChange={setMode}
            onSettingsClick={() => setIsSidebarOpen(true)}
            onCalendarClick={isMobile ? () => setIsCalendarOpen(true) : undefined}
            calendarButtonRef={calendarButtonRef}
            showSettings={true}
          />
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


        {isCalendarOpen && isMobile && (
          <ReportDateRangePicker
            startDate={(() => {
              // Вычисляем дату начала двух недель (среда)
              const start = new Date(currentDate);
              const dayOfWeek = currentDate.getDay();
              let offsetToWednesday: number;
              
              if (dayOfWeek === 0) offsetToWednesday = -4;
              else if (dayOfWeek === 1) offsetToWednesday = -5;
              else if (dayOfWeek === 2) offsetToWednesday = -6;
              else if (dayOfWeek === 3) offsetToWednesday = 0;
              else if (dayOfWeek === 4) offsetToWednesday = -1;
              else if (dayOfWeek === 5) offsetToWednesday = -2;
              else offsetToWednesday = -3;
              
              start.setDate(currentDate.getDate() + offsetToWednesday);
              return start;
            })()}
            endDate={(() => {
              // Вычисляем дату конца двух недель (13 дней после среды)
              const start = new Date(currentDate);
              const dayOfWeek = currentDate.getDay();
              let offsetToWednesday: number;
              
              if (dayOfWeek === 0) offsetToWednesday = -4;
              else if (dayOfWeek === 1) offsetToWednesday = -5;
              else if (dayOfWeek === 2) offsetToWednesday = -6;
              else if (dayOfWeek === 3) offsetToWednesday = 0;
              else if (dayOfWeek === 4) offsetToWednesday = -1;
              else if (dayOfWeek === 5) offsetToWednesday = -2;
              else offsetToWednesday = -3;
              
              start.setDate(currentDate.getDate() + offsetToWednesday);
              const end = new Date(start);
              end.setDate(start.getDate() + 13);
              return end;
            })()}
            initialMonth={getDisplayMonthDate(currentDate)}
            onDateChange={handleScheduleDateChange}
            onClose={() => setIsCalendarOpen(false)}
            buttonRef={calendarButtonRef}
          />
        )}
    </div>
  )
}

export default WorkSchedulePage
