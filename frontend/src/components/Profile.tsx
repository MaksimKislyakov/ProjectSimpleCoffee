import React, { useEffect, useState, useRef } from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate, useLocation } from "react-router-dom";
import WorkSchedule from "./WorkSchedule.tsx";
import AddScheduleModal from "./AddScheduleModal.tsx";
import ReportDateRangePicker from "./ReportDateRangePicker.tsx";
import CoffeeShopSelector from "./CoffeeShopSelector.tsx";
import {
  DayData,
  generateWeekDays,
  generateMonthDays,
  generateTwoWeeks,
  getWeekLabel,
  getMonthLabel,
  getTwoWeeksLabel
} from "../components/useScheduleUtils.tsx";


interface UserData {
  first_name: string;
  last_name: string;
  patronymic: string;
  email: string;
  telephone: string;
  role_id: number;
  hourly_rate: string;
  assessment_rate: number;
  work_experience: number;
  id: number;
  data_work_start: number;
  coffee_shop_id: number;
}

interface ReportData {
  work_days: number;
  work_hours: number;
  total_earnings: string;
}


const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [shouldLogout, setShouldLogout] = useState(false);
  const [mode, setMode] = useState<"week" | "month">("week");
  const [coffeeShopAddress, setCoffeeShopAddress] = useState<string>("");
  const [selectedCoffeeShopId, setSelectedCoffeeShopId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedCoffeeShopId");
    return saved ? parseInt(saved, 10) : null;
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);

  const [days, setDays] = useState<DayData[]>([]);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Состояние для периода отчета
  const [reportStartDate, setReportStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reportEndDate, setReportEndDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarButtonRef = useRef<HTMLDivElement | null>(null);
  const [isScheduleCalendarOpen, setIsScheduleCalendarOpen] = useState(false);
  const scheduleCalendarButtonRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 394);

  // Обработчик изменения филиала
  const handleCoffeeShopChange = (shopId: number) => {
    setSelectedCoffeeShopId(shopId);
    localStorage.setItem("selectedCoffeeShopId", shopId.toString());
    
    // Обновляем адрес кофейни
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/v1/coffee_shop/get_coffee_shops", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((coffeeShops) => {
          const shop = Array.isArray(coffeeShops) 
            ? coffeeShops.find((s: any) => s.id === shopId)
            : null;
          if (shop && shop.adress) {
            setCoffeeShopAddress(shop.adress);
          }
        })
        .catch((err) => {
          console.error("Ошибка загрузки адреса кофейни:", err);
        });
    }
    
    // Перезагружаем данные
    if (user) {
      fetchReport();
      fetchAllUsersAndSchedules();
      fetchSchedule();
    }
  };


  const fetchSchedule = async () => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Сначала генерируем пустые дни для текущего режима
      // Для мобильной версии используем 2 недели, для веб - неделя/месяц
      let emptyDays: DayData[] = [];
      
      if (isMobile) {
        emptyDays = generateTwoWeeks(currentDate);
      } else {
        // В веб-версии всегда отображаем только неделю (7 дней)
        emptyDays = generateWeekDays(currentDate);
      }

      const res = await fetch("/api/v1/schedule/get_all_schedule", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 404 || !res.ok) {
        // Если расписания нет, используем пустые дни
        console.log("Расписание не найдено, используем пустые ячейки");
        setDays(emptyDays.map(day => ({ ...day, isEmpty: true })));
        return;
      }

      const schedule = await res.json();

      const scheduleArray = Array.isArray(schedule) ? schedule : [schedule];
      const userSchedule = scheduleArray.filter(
        (item: any) => item.user_id === user.id
      );

      if (userSchedule.length === 0) {
        // Нет смен для пользователя - используем пустые дни
        setDays(emptyDays.map(day => ({ ...day, isEmpty: true })));
        return;
      }

      // Обновляем дни данными из расписания
      const updatedDays = emptyDays.map(emptyDay => {
        // Находим смену для этого дня (простое сравнение по числу)
        const scheduleItem = userSchedule.find((item: any) => {
          if (!item.schedule_start_time || !item.schedule_end_time) {
            return false; // Пропускаем элементы без времени
          }
          
          const scheduleDate = new Date(item.schedule_start_time);

          return (
            scheduleDate.getFullYear() === emptyDay.fullDate.getFullYear() &&
            scheduleDate.getMonth() === emptyDay.fullDate.getMonth() &&
            scheduleDate.getDate() === emptyDay.fullDate.getDate()
          );
        });

        // Проверяем, есть ли данные о начале и конце рабочего дня
        if (scheduleItem && 
            scheduleItem.schedule_start_time && 
            scheduleItem.schedule_end_time) {
          
          const start = new Date(scheduleItem.schedule_start_time);
          const end = new Date(scheduleItem.schedule_end_time);

          const formatTime = (d: Date) =>
            d.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            });

          const isConfirmed = scheduleItem.is_confirmed === true;
          const isActive = scheduleItem.status === "active";

          // Определяем тип смены: утренняя или вечерняя (только для рабочих дней)
          let shiftType = "full";
          if (isActive && isConfirmed) {
            const endHour = end.getHours();
            const startHour = start.getHours();
            const isMorningShift = endHour < 17 || (endHour === 17 && end.getMinutes() === 0);
            const isEveningShift = startHour >= 17;
            shiftType = isEveningShift ? "evening" : (isMorningShift ? "morning" : "full");
          }

          return {
            ...emptyDay,
            date: emptyDay.date, // Сохраняем исходную дату
            time: `${formatTime(start)} ${formatTime(end)}`,
            isWorkDay: isActive && isConfirmed, // Подтвержденный рабочий день
            isEmpty: false, // Есть данные - не пустой
            isConfirmed: isConfirmed,
            shiftType: shiftType // Тип смены для стилизации
          };
        }

        // Если нет данных о времени - день без расписания
        return {
          ...emptyDay,
          isEmpty: true
        };
      });

      setDays(updatedDays);

    } catch (err) {
      console.error("Ошибка получения расписания", err);
      // При ошибке показываем пустые дни
      let errorDays: DayData[] = [];
      if (isMobile) {
        errorDays = generateTwoWeeks(currentDate);
      } else if (mode === "week") {
        errorDays = generateWeekDays(currentDate);
      } else {
        errorDays = generateMonthDays(currentDate);
      }
      setDays(errorDays.map(day => ({ ...day, isEmpty: true })));
    } finally {
      // Schedule loading completed
    }
  };

useEffect(() => {
  if (user) fetchSchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, mode, currentDate, isMobile]);

// Обработчик изменения размера окна для пересчета графика
useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth <= 394;
    setIsMobile(mobile);
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

const fetchReport = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    setShouldLogout(true);
    return;
  }

  try {
    // Форматируем даты для API (ISO формат)
    const startDateStr = reportStartDate.toISOString();
    const endDateStr = reportEndDate.toISOString();
    
    const res = await fetch(
      `/api/v1/report/get_my_report?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Ошибка загрузки отчета:", res.status);
      const errorData = await res.json().catch(() => ({}));
      console.error("Детали ошибки:", errorData);
      return;
    }

    const reportData: ReportData = await res.json();
    setReport(reportData);
    
  } catch (err) {
    console.error("Ошибка получения отчета", err);
  } finally {
    setReportLoading(false);
  }
};

  const fetchAllUsersAndSchedules = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Загружаем всех пользователей
      const usersRes = await fetch("/api/v1/user/all_users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(Array.isArray(usersData) ? usersData : []);
      }

      // Загружаем все расписания
      const schedulesRes = await fetch("/api/v1/schedule/get_all_schedule", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setAllSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      }
    } catch (err) {
      console.error("Ошибка загрузки пользователей и расписания:", err);
    }
  };

  // Находим ближайшую смену текущего пользователя
  const getNextShift = () => {
    if (!user || !allSchedules.length) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const userSchedules = allSchedules
      .filter((s: any) => s.user_id === user.id && s.schedule_start_time)
      .map((s: any) => ({
        ...s,
        date: new Date(s.schedule_start_time)
      }))
      .filter((s: any) => s.date >= now)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
    
    return userSchedules.length > 0 ? userSchedules[0] : null;
  };

  // Получаем сотрудников, работающих в день ближайшей смены
  const getEmployeesForNextShift = () => {
    const nextShift = getNextShift();
    if (!nextShift) return [];
    
    const shiftDate = new Date(nextShift.schedule_start_time);
    shiftDate.setHours(0, 0, 0, 0);
    
    const employees = allSchedules
      .filter((s: any) => {
        if (!s.schedule_start_time || s.user_id === user?.id) return false;
        const scheduleDate = new Date(s.schedule_start_time);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === shiftDate.getTime();
      })
      .map((s: any) => {
        const employee = allUsers.find((u: any) => u.id === s.user_id);
        if (!employee) return null;
        
        const start = new Date(s.schedule_start_time);
        const end = new Date(s.schedule_end_time);
        const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        
        return {
          ...employee,
          roleText: getRoleText(employee.role_id),
          time: `${startTime} - ${endTime}`
        };
      })
      .filter((e: any) => e !== null)
      .sort((a: any, b: any) => {
        // Сначала управляющий (роль 2), потом остальные
        if (a.role_id === 2 && b.role_id !== 2) return -1;
        if (a.role_id !== 2 && b.role_id === 2) return 1;
        return 0;
      });
    
    return employees;
  };

  // Форматирование имени в формате "Имя Ф." для отчета
  const getShortNameReport = (firstName: string, lastName: string): string => {
    const lastNameInitial = lastName ? lastName.charAt(0).toUpperCase() + "." : "";
    return `${firstName} ${lastNameInitial}`.trim();
  };

  // Получаем текущий период для календаря на основе выбранных дат
  const getCurrentPeriod = () => {
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
                    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    
    // Если период в пределах одного месяца
    if (reportStartDate.getMonth() === reportEndDate.getMonth() && 
        reportStartDate.getFullYear() === reportEndDate.getFullYear()) {
      const month = months[reportStartDate.getMonth()];
      return `${reportStartDate.getDate()}-${reportEndDate.getDate()} ${month} ${reportStartDate.getFullYear()}`;
    }
    
    // Если период охватывает несколько месяцев
    const startMonth = months[reportStartDate.getMonth()];
    const endMonth = months[reportEndDate.getMonth()];
    return `${reportStartDate.getDate()} ${startMonth} - ${reportEndDate.getDate()} ${endMonth} ${reportEndDate.getFullYear()}`;
  };

  // Обработчик изменения периода отчета
  const handleReportDateChange = (startDate: Date, endDate: Date) => {
    setReportStartDate(startDate);
    setReportEndDate(endDate);
    setIsCalendarOpen(false);
    // Перезагружаем отчет с новыми датами
    setReportLoading(true);
    setTimeout(() => {
      fetchReport();
    }, 100);
  };

  // Обработчик изменения даты для графика работы (выбираем начало двух недель)
  const handleScheduleDateChange = (startDate: Date, endDate: Date) => {
    // Используем начальную дату для установки currentDate
    // Выравниваем на среду начала двухнедельного периода
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
    setIsScheduleCalendarOpen(false);
    // Расписание перезагрузится автоматически через useEffect при изменении currentDate
  };

// загрузка пользователя 
useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setShouldLogout(true);
      return;
    }

    try {
      const res = await fetch("/api/v1/user/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setShouldLogout(true);
        return;
      }

      const data: UserData = await res.json();
      setUser(data);
      
      // Устанавливаем выбранный филиал из localStorage или используем филиал пользователя
      const shopIdToUse = selectedCoffeeShopId || data.coffee_shop_id;
      if (shopIdToUse && shopIdToUse !== selectedCoffeeShopId) {
        setSelectedCoffeeShopId(shopIdToUse);
        localStorage.setItem("selectedCoffeeShopId", shopIdToUse.toString());
      }
      
      // Загружаем адрес кофейни
      const shopId = selectedCoffeeShopId || data.coffee_shop_id;
      if (shopId) {
        // Для роли 3 (сотрудник) не вызываем API, который требует прав админа/менеджера
        if (data.role_id === 3) {
          // Для роли 3 показываем просто "Филиал" без адреса, так как нет доступа к API
          setCoffeeShopAddress("Филиал");
        } else {
          // Для ролей 1 и 2 загружаем список кофеен
          try {
            const coffeeShopRes = await fetch("/api/v1/coffee_shop/get_coffee_shops", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            
            if (coffeeShopRes.ok) {
              const coffeeShops = await coffeeShopRes.json();
              const shop = Array.isArray(coffeeShops) 
                ? coffeeShops.find((s: any) => s.id === shopId)
                : null;
              if (shop && shop.adress) {
                setCoffeeShopAddress(shop.adress);
              }
            }
          } catch (err) {
            console.error("Ошибка загрузки адреса кофейни:", err);
          }
        }
      }
      
      // После успешной загрузки пользователя загружаем отчет
      await fetchReport();
      // Загружаем всех пользователей и расписание для ближайшей смены
      await fetchAllUsersAndSchedules();
      
    } catch (err) {
      console.error(err);
      setShouldLogout(true);
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, []);

// Перезагружаем отчет при изменении периода или филиала
useEffect(() => {
  if (user) {
    fetchReport();
    fetchAllUsersAndSchedules();
    fetchSchedule();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [reportStartDate, reportEndDate, selectedCoffeeShopId]);


  /** === Форматирование имени и стажа === **/

  const getShortName = (fullName: string) => {
    if (fullName.length <= 23) return fullName;
    return fullName.slice(0, 23) + "...";
  };

  const formatYears = (years: number) => {
    const lastDigit = years % 10;
    const lastTwo = years % 100;

    if (lastTwo >= 11 && lastTwo <= 14) return `${years} лет`;
    if (lastDigit === 1) return `${years} год`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${years} года`;

    return `${years} лет`;
  };

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

  useEffect(() => {
    if (shouldLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("role_id");
      navigate("/");
    }
  }, [shouldLogout, navigate]);

  const handleLogout = () => setShouldLogout(true);

 const goPrev = () => {
  const newDate = new Date(currentDate);
  if (isMobile) {
    // Для мобильной версии листаем по 2 недели
    newDate.setDate(newDate.getDate() - 14);
  } else if (mode === "week") {
    newDate.setDate(newDate.getDate() - 7);
  } else {
    newDate.setMonth(newDate.getMonth() - 1);
  }
  setCurrentDate(newDate);
};

  const goNext = () => {
  const newDate = new Date(currentDate);
  if (isMobile) {
    // Для мобильной версии листаем по 2 недели
    newDate.setDate(newDate.getDate() + 14);
  } else if (mode === "week") {
    newDate.setDate(newDate.getDate() + 7);
  } else {
    newDate.setMonth(newDate.getMonth() + 1);
  }
  setCurrentDate(newDate);
  };

  const onChangeMode = (newMode: "week" | "month") => {
  setMode(newMode);
  // При смене режима генерируем соответствующие дни
  setMode(newMode);
  };

  // Пока загружаются данные
  if (loading) {
    return <div className="profile-page">Загрузка...</div>;
  }

  // Если пользователь не загрузился
  if (!user) {
    return <div className="profile-page">Ошибка загрузки данных</div>;
  }

  // Формирование ФИО
  const fullFIO = `${user.last_name} ${user.first_name} ${user.patronymic}`;
  const shortFIO = getShortName(fullFIO);

  // Общие навигационные кнопки для менеджера/админа
  const NavButtons: React.FC = () => {
    const { pathname } = useLocation();
    const scheduleActive = pathname.startsWith("/schedule");
    const reportActive = pathname.startsWith("/report") || pathname.startsWith("/profile/report");

    return (
      <>
        <button className={`link-btn ${scheduleActive ? "active" : ""}`} onClick={() => navigate("/schedule")}>График работы</button>
        <button className={`link-btn ${reportActive ? "active" : ""}`} onClick={() => navigate("/report")}>Отчёт</button>
      </>
    );
  };

  return (
    <div className="profile-page">
      {/* Верхняя панель - Десктоп */}
      <header className="profile-header desktop-header">
        <div className="desktop-header-left">
          <Icons.LogoIcon className="logo" title="logo" />
          {/* Выпадающий список филиалов для ролей 1 и 2 */}
          {user && (user.role_id === 1 || user.role_id === 2) ? (
            <CoffeeShopSelector
              selectedShopId={selectedCoffeeShopId}
              onShopChange={handleCoffeeShopChange}
              roleId={user.role_id}
            />
          ) : (
            coffeeShopAddress && (
              <span className="desktop-coffee-shop-address">{coffeeShopAddress}</span>
            )
          )}
        </div>

        <div className="desktop-header-right">
          {/* Для админа (1) и менеджера (2) показываем кнопки навигации */}
          {(user.role_id === 1 || user.role_id === 2) && (
            <div className="manager-controls">
              <div className="nav-buttons">
                <NavButtons />
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
          {/* Выпадающий список филиалов для ролей 1 и 2 */}
          {user && (user.role_id === 1 || user.role_id === 2) ? (
            <CoffeeShopSelector
              selectedShopId={selectedCoffeeShopId}
              onShopChange={handleCoffeeShopChange}
              roleId={user.role_id}
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

      <main className="profile-content">
        {/* Информация о сотруднике */}
        <section className="profile-card employee-main">
          <div className="photo-placeholder"></div>

          {/* Десктопная версия */}
          <div className="info-left desktop-info">
            <h2>Информация о сотруднике</h2>

            <div className="fio-wrapper">
              <p className="fio-label">ФИО:</p>

              <div className="fio-container">
                <span className="fio-text">{shortFIO}</span>

                <div className="fio-popup">
                  {fullFIO}
                  <div className="fio-popup-arrow"></div>
                </div>
              </div>
            </div>

            <p><span>Должность:</span> {user.role_id}</p>
            <p><span>Почта:</span> {user.email}</p>
            <p><span>Телефон:</span> {user.telephone}</p>
          </div>

          <div className="info-right desktop-info">
            <p><span>Опыт работы:</span> {formatYears(user.work_experience)}</p>
            <p><span>Уровень аттестации:</span> {user.assessment_rate}</p>
            <p><span>Часовая ставка:</span> {Number(user.hourly_rate)} ₽</p>
            <p><span>Начало работы:</span> {new Date(user.data_work_start).toLocaleDateString()}</p>
          </div>

          {/* Мобильная версия - объединенный блок */}
          <div className="mobile-info">
            {/* Аватар, имя и роль */}
            <div className="mobile-employee-info">
              <div className="mobile-employee-avatar">
                <div className="avatar-circle">
                </div>
              </div>
              <div className="mobile-employee-details">
                <span className="mobile-employee-role-name">
                  <span className="mobile-employee-role">{getRoleText(user.role_id)}</span>
                  <span className="mobile-employee-separator"> - </span>
                  <span className="mobile-employee-name">
                    {getShortNameMobile(user.first_name || "", user.last_name || "", user.patronymic || "") || user.first_name || "Пользователь"}
                  </span>
                </span>
              </div>
            </div>
            
            {/* Остальная информация */}
            <div className="mobile-info-details">
              <p><span>Начало работы:</span> {new Date(user.data_work_start).toLocaleDateString()}</p>
              <p><span>Уровень аттестации:</span> {user.assessment_rate}</p>
              <p><span>Почта:</span> {user.email}</p>
              <p><span>Телефон:</span> {user.telephone}</p>
              {(user.role_id === 1 || user.role_id === 2) && (
                <p><span>Часовая ставка:</span> {Number(user.hourly_rate)} ₽</p>
              )}
            </div>
          </div>
        </section>

        {/* Отчёт */}
        <section className="profile-card report">
          <div className="report-header">
            <h2 className="report-title">Отчёт</h2>
            <div className="report-calendar-controls">
              <div 
                ref={calendarButtonRef}
                className="report-calendar-button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                style={{ cursor: 'pointer' }}
              >
                <Icons.CalendarWhiteIcon title="calendar" />
                <span>{getCurrentPeriod()}</span>
              </div>
            </div>
            {getNextShift() && (
              <div className="report-next-shift-header">
                <span className="next-shift-label">Ближайшая смена</span>
                <div className="next-shift-date">
                  {new Date(getNextShift()!.schedule_start_time).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="report-stats">
            <div className="report-stats-cards">
              <div className="report-stat-card">
                <span className="report-stat-label">Рабочие часы</span>
                <span className="report-stat-value">
                  {reportLoading ? "..." : Math.round(report?.work_hours || 0)}
                </span>
              </div>

              <div className="report-stat-card">
                <span className="report-stat-label">Смены</span>
                <span className="report-stat-value">
                  {reportLoading ? "..." : (report?.work_days || 0)}
                </span>
              </div>
            </div>

            {/* Ближайшая смена - список сотрудников (десктопная версия) */}
            {getNextShift() && getEmployeesForNextShift().length > 0 && (
              <div className="report-next-shift-block desktop-next-shift">
                <div className="next-shift-employees">
                  {getEmployeesForNextShift().map((emp: any) => (
                    <div key={emp.id} className="next-shift-employee">
                      <span className="employee-name-short">{getShortNameReport(emp.first_name, emp.last_name)}</span>
                      <span className={`employee-role ${emp.role_id === 2 ? 'role-manager' : ''}`}>
                        {emp.roleText}
                      </span>
                      {emp.role_id !== 2 && <span className="employee-time">{emp.time}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ближайшая смена - мобильная версия */}
          {getNextShift() && (
            <div className="mobile-next-shift-section">
              <div className="mobile-next-shift-header">
                <span className="next-shift-label">Ближайшая смена</span>
                <div className="next-shift-date">
                  {new Date(getNextShift()!.schedule_start_time).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Список сотрудников, работающих в этот день */}
              {getEmployeesForNextShift().length > 0 && (
                <div className="next-shift-employees">
                  {getEmployeesForNextShift().map((emp: any) => (
                    <div key={emp.id} className="next-shift-employee">
                      <span className="employee-name-short">{getShortNameReport(emp.first_name, emp.last_name)}</span>
                      <span className={`employee-role ${emp.role_id === 2 ? 'role-manager' : ''}`}>
                        {emp.roleText}
                      </span>
                      {emp.role_id !== 2 && <span className="employee-time">{emp.time}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <WorkSchedule
          currentLabel={
            isMobile
              ? getTwoWeeksLabel(currentDate)
              : mode === "week" 
                ? getWeekLabel(currentDate) 
                : getMonthLabel(currentDate)
          }
          mode={mode}
          onPrev={goPrev}
          onNext={goNext}
          onChangeMode={onChangeMode}
          isMobile={isMobile}
          onCalendarClick={isMobile ? () => setIsScheduleCalendarOpen(!isScheduleCalendarOpen) : undefined}
          calendarButtonRef={scheduleCalendarButtonRef}
        >
          {/* Заголовок с названиями дней недели */}
          <div className="schedule-weekdays-header">
            {days.slice(0, 7).map((d, i) => {
              const today = new Date();
              const isToday = d.fullDate.getDate() === today.getDate() &&
                             d.fullDate.getMonth() === today.getMonth() &&
                             d.fullDate.getFullYear() === today.getFullYear();
              return (
                <div key={i} className={`weekday-header-item ${isToday ? 'today' : ''}`}>
                  <div className="weekday-name">{isMobile ? ['Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Пн', 'Вт'][i] : d.weekday}</div>
                </div>
              );
            })}
          </div>
          {(isMobile ? days : days.slice(0, 7)).map((d, i) => (
            <div key={i} className="day-cell-wrapper">
              <div className="day-date-label">{d.dayNumber}</div>
              <div 
                className={`day-col ${d.isEmpty ? 'empty-day' : d.isWorkDay ? `work-day shift-${(d as any).shiftType || 'full'}` : d.isConfirmed === false ? 'unconfirmed-day' : ''}`}
                onClick={() => {
                  // При клике на пустой день открываем модалку для добавления смены
                  if (d.isEmpty) {
                    setModalDate(d.fullDate);
                  }
                }}
                style={{ cursor: d.isEmpty ? 'pointer' : 'default' }}
              >
                {d.time && (
                  <div className="day-time">{d.time}</div>
                )}
              </div>
            </div>
          ))}
        </WorkSchedule>
        {modalDate && (
          <AddScheduleModal
            date={modalDate}
            position={null}
            onConfirm={async (startTime: string, endTime: string) => {
              if (!user) return;
              const token = localStorage.getItem("token");
              
              const formatLocalDateTime = (date: Date, time: string): string => {
                const [hours, minutes] = time.split(":").map(Number);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
              };

              const body = {
                user_id: user.id,
                coffee_shop_id: user.coffee_shop_id,
                status: "active",
                schedule_start_time: formatLocalDateTime(modalDate, startTime),
                schedule_end_time: formatLocalDateTime(modalDate, endTime),
                is_confirmed: false
              };

              const res = await fetch("/api/v1/schedule/create_schedule", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
              });

              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Ошибка ${res.status}`);
              }

              setModalDate(null);
              // Перезагружаем расписание для обновления данных
              if (user) {
                fetchSchedule();
              }
            }}
            onClose={() => setModalDate(null)}
          />
        )}

        {isCalendarOpen && (
          <ReportDateRangePicker
            startDate={reportStartDate}
            endDate={reportEndDate}
            onDateChange={handleReportDateChange}
            onClose={() => setIsCalendarOpen(false)}
            buttonRef={calendarButtonRef}
          />
        )}

        {isScheduleCalendarOpen && isMobile && (
          <ReportDateRangePicker
            startDate={currentDate}
            endDate={(() => {
              const end = new Date(currentDate);
              end.setDate(end.getDate() + 13);
              return end;
            })()}
            onDateChange={handleScheduleDateChange}
            onClose={() => setIsScheduleCalendarOpen(false)}
            buttonRef={scheduleCalendarButtonRef}
          />
        )}

      </main>
    </div>
  );
};

export default ProfilePage;
