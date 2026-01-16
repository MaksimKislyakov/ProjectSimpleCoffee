import React, { useEffect, useState, useRef } from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate, useLocation } from "react-router-dom";
import WorkSchedule from "./WorkSchedule.tsx";
import AddScheduleModal from "./AddScheduleModal.tsx";
import ReportDateRangePicker from "./ReportDateRangePicker.tsx";
import CoffeeShopSelector from "./CoffeeShopSelector.tsx";
import ScheduleSettingsSidebar from "./ScheduleSettingsSidebar.tsx";
import {
  DayData,
  ScheduleItem,
  generateWeekDays,
  generateMonthDays,
  generateTwoWeeks,
  getWeekLabel,
  getTwoWeeksLabel
} from "../components/useScheduleUtils.tsx";

interface UserData {
  first_name: string;
  last_name: string;
  patronymic: string | null | undefined;
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
  work_days: number | null | undefined;
  work_hours: number | null | undefined;
  total_earnings: string;
  total_award?: number | null;
  total_fine?: number | null;
  user_id?: number;
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
  const [coffeeShops, setCoffeeShops] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Обработчик изменения филиала
  const handleCoffeeShopChange = async (shopId: number) => {
    setSelectedCoffeeShopId(shopId);
    localStorage.setItem("selectedCoffeeShopId", shopId.toString());
    
    // Обновляем адрес кофейни из уже загруженных данных
    const shop = coffeeShops.find((s: any) => s.id === shopId);
    if (shop && shop.adress) {
      setCoffeeShopAddress(shop.adress);
    }
    
    // Перезагружаем данные
    if (user) {
      const { schedules } = await fetchAllUsersAndSchedules();
      await fetchReport(schedules);
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

      const res = await fetch("http://localhost:8000/api/v1/schedule/get_all_schedule", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // Даже при ошибке — показываем пустые дни
        setDays(emptyDays.map(day => ({ ...day, isEmpty: true })));
        return;
      }

      const schedule = await res.json();
      const scheduleArray = Array.isArray(schedule) ? schedule : [];

      // Обновляем дни: привязываем смены
      const updatedDays = emptyDays.map(emptyDay => {
        const scheduleItem = scheduleArray.find((item: ScheduleItem) => {
          if (!item.schedule_start_time) return false;
          const itemDate = new Date(item.schedule_start_time);
          return (
            itemDate.getFullYear() === emptyDay.fullDate.getFullYear() &&
            itemDate.getMonth() === emptyDay.fullDate.getMonth() &&
            itemDate.getDate() === emptyDay.fullDate.getDate() &&
            item.user_id === user.id
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
          const isActive = scheduleItem.status === "active" || scheduleItem.status === "Рабочая смена";

          // Определяем тип смены: утренняя или вечерняя (для всех смен с временем)
          // Логика: до 17:00 - утренняя, после 17:00 - вечерняя, иначе - полная
          let shiftType = "full";
          if (start && end) {
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
            startTime: formatTime(start),
            endTime: formatTime(end),
            isWorkDay: isActive && isConfirmed, // Подтвержденный рабочий день
            isEmpty: false, // Есть данные - не пустой
            isConfirmed: isConfirmed,
            shiftType: shiftType // Тип смены для стилизации
          };
        }

        // Если нет данных о времени - день без расписания
        return {
          ...emptyDay,
          schedule: scheduleItem || null,
          isEmpty: !scheduleItem
        };
      });

      setDays(updatedDays);
    } catch (err) {
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

// Функция для подсчета рабочих часов на клиенте (используем ту же логику, что и в отчете)
const countWorkHoursForUser = (userId: number, schedules: any[], startDate: Date, endDate: Date): number => {
  let totalHours = 0;
  
  schedules.forEach((s: any) => {
    if (!s || s.user_id !== userId || !s.schedule_start_time || !s.schedule_end_time) return;
    
    const sd = new Date(s.schedule_start_time);
    // Проверяем, что попадает в целевой период
    if (sd < startDate || sd > endDate) return;

    // Проверяем, что это рабочая смена (единый формат: "Рабочая смена")
    // Также учитываем "active" для обратной совместимости со старыми данными
    const status = (s.status || "").toLowerCase();
    const isWorkShift = status === "рабочая смена" || status === "active";
    if (!isWorkShift) return; // Пропускаем нерабочие смены (выходные, больничные и т.д.)

    // Проверяем, что смена завершена (end_time > start_time) - как в бэкенде
    const start = new Date(s.schedule_start_time);
    const end = new Date(s.schedule_end_time);
    if (end.getTime() <= start.getTime()) return;
    
    // Считаем длительность в часах
    const ms = Math.max(0, end.getTime() - start.getTime());
    const hours = ms / (1000 * 60 * 60);
    totalHours += hours;
  });
  
  return Math.round(totalHours);
};

// Функция для подсчета смен на клиенте (используем ту же логику, что и в отчете)
const countShiftsForUser = (userId: number, schedules: any[], startDate: Date, endDate: Date): number => {
  let shifts = 0;
  
  schedules.forEach((s: any) => {
    if (!s || s.user_id !== userId || !s.schedule_start_time || !s.schedule_end_time) return;
    
    const sd = new Date(s.schedule_start_time);
    // Проверяем, что попадает в целевой период
    if (sd < startDate || sd > endDate) return;

    // Проверяем, что это рабочая смена (единый формат: "Рабочая смена")
    // Также учитываем "active" для обратной совместимости со старыми данными
    const status = (s.status || "").toLowerCase();
    const isWorkShift = status === "рабочая смена" || status === "active";
    if (!isWorkShift) return; // Пропускаем нерабочие смены (выходные, больничные и т.д.)

    // Проверяем, что смена завершена (end_time > start_time) - как в бэкенде
    const start = new Date(s.schedule_start_time);
    const end = new Date(s.schedule_end_time);
    if (end.getTime() <= start.getTime()) return;
    
    shifts += 1;
  });
  
  return shifts;
};

const fetchReport = async (schedulesOverride?: any[]) => {
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
      `http://localhost:8000/api/v1/report/get_my_report?start_date=${encodeURIComponent(startDateStr)}&end_date=${encodeURIComponent(endDateStr)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return;
    }

    const reportData: ReportData = await res.json();
    
    // Пересчитываем рабочие часы и смены на клиенте, если есть расписания
    // Это нужно, потому что бэкенд считает все часы (включая выходные), а не только рабочие
    const schedulesToUse = schedulesOverride ?? allSchedules;
    if (user && schedulesToUse.length > 0) {
      const calculatedShifts = countShiftsForUser(user.id, schedulesToUse, reportStartDate, reportEndDate);
      const calculatedHours = countWorkHoursForUser(user.id, schedulesToUse, reportStartDate, reportEndDate);
      
      
      // Обновляем данные только если пересчет дал другие результаты
      // (бэкенд может возвращать неправильные данные из-за отсутствия проверки статуса)
      reportData.work_days = calculatedShifts;
      reportData.work_hours = calculatedHours;
    }
    
    setReport(reportData);
    
  } catch (err) {
  } finally {
    setReportLoading(false);
  }
};

  const fetchAllUsersAndSchedules = async () => {
    const token = localStorage.getItem("token");
    if (!token) return { users: [], schedules: [] };

    try {
      const usersRes = await fetch("http://localhost:8000/api/v1/user/all_users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      let usersData: any[] = [];
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        usersData = Array.isArray(usersJson) ? usersJson : [];
        setAllUsers(usersData);
      }

      const schedulesRes = await fetch("http://localhost:8000/api/v1/schedule/get_all_schedule", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      let schedulesData: any[] = [];
      if (schedulesRes.ok) {
        const schedulesJson = await schedulesRes.json();
        schedulesData = Array.isArray(schedulesJson) ? schedulesJson : [];
        setAllSchedules(schedulesData);
      }

      return { users: usersData, schedules: schedulesData };
    } catch (err) {
    }
    return { users: [], schedules: [] };
  };

  const saveSchedules = async (schedules: any[]) => {
    const token = localStorage.getItem("token");
    const role_id = Number(localStorage.getItem("role_id"));
    const user_id = Number(localStorage.getItem("user_id"));
    
    if (!token) {
      throw new Error("Токен не найден");
    }

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
      await fetchSchedule();
      await fetchAllUsersAndSchedules();
    } catch (e) {
      throw e;
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

// === СОТРУДНИКИ, КОТОРЫЕ РАБОТАЮТ В ДЕНЬ БЛИЖАЙШЕЙ СМЕНЫ ===
  const getEmployeesForNextShift = () => {
    const nextShift = getNextShift();
    if (!nextShift) return [];
    
    const shiftDate = new Date(nextShift.schedule_start_time);
    shiftDate.setHours(0, 0, 0, 0); // Начало дня
    
    // Находим все подтверждённые смены на эту дату
    const employeesOnShiftDay = allSchedules
      .filter((s: any) => {
        if (!s.schedule_start_time || !s.is_confirmed) return false; // Только подтверждённые
        const scheduleDate = new Date(s.schedule_start_time);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate.getTime() === shiftDate.getTime(); // Тот же день
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
          time: `${startTime} - ${endTime}`,
          isCurrentUser: user ? employee.id === user.id : false // Для выделения текущего пользователя
        };
      })
      .filter((e: any) => e !== null)
      .sort((a: any, b: any) => {
        // Сначала Управляющий (роль 2), потом Админ (1), потом Бариста (3)
        if (a.role_id === 2 && b.role_id !== 2) return -1;
        if (a.role_id !== 2 && b.role_id === 2) return 1;
        if (a.role_id === 1 && b.role_id !== 1) return -1;
        if (a.role_id !== 1 && b.role_id === 1) return 1;
        return 0;
      });
    
    return employeesOnShiftDay;
  };

  const getShortNameReport = (firstName: string, lastName: string): string => {
    const initial = lastName ? lastName.charAt(0).toUpperCase() + "." : "";
    return `${firstName} ${initial}`.trim();
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
        const res = await fetch("http://localhost:8000/api/v1/user/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
          setShouldLogout(true);
          return;
        }

      const data: UserData = await res.json();
      setUser(data);
      
      const isBarista = data.role_id === 3;
      // Устанавливаем выбранный филиал из localStorage только для админа/менеджера
      if (!isBarista) {
        const shopIdToUse = selectedCoffeeShopId || data.coffee_shop_id;
        if (shopIdToUse && shopIdToUse !== selectedCoffeeShopId) {
          setSelectedCoffeeShopId(shopIdToUse);
          localStorage.setItem("selectedCoffeeShopId", shopIdToUse.toString());
        }
      } else {
        // Для бариста не используем выбор филиала и не трогаем localStorage
        setSelectedCoffeeShopId(null);
      }
      
      // Загружаем адрес кофейни
      const shopId = isBarista ? data.coffee_shop_id : (selectedCoffeeShopId || data.coffee_shop_id);
      if (shopId) {
        // Для роли 3 (сотрудник) используем coffee_shop_id из данных пользователя
        // Делаем запрос на http://localhost:8000/api/v1/coffee_shop/{coffee_shop_id} для получения адреса
        if (isBarista) {
          if (data.coffee_shop_id) {
            try {
              const coffeeShopRes = await fetch(`http://localhost:8000/api/v1/coffee_shop/${data.coffee_shop_id}`, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
              });
              
              if (coffeeShopRes.ok) {
                const shopData = await coffeeShopRes.json();
                const addressValue = shopData?.adress || shopData?.address;
                if (addressValue) {
                  setCoffeeShopAddress(addressValue);
                } else {
                  setCoffeeShopAddress(`Филиал #${data.coffee_shop_id}`);
                }
              } else {
                // Если не получилось получить адрес (нет прав), показываем ID
                setCoffeeShopAddress(`Филиал #${data.coffee_shop_id}`);
              }
            } catch (err) {
              setCoffeeShopAddress(`Филиал #${data.coffee_shop_id}`);
            }
          } else {
            setCoffeeShopAddress("Филиал");
          }
        } else {
          // Для ролей 1 и 2 загружаем список кофеен
          try {
            const coffeeShopRes = await fetch("http://localhost:8000/api/v1/coffee_shop/get_coffee_shops", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
            
            if (coffeeShopRes.ok) {
              const coffeeShopsData = await coffeeShopRes.json();
              const shopsArray = Array.isArray(coffeeShopsData) ? coffeeShopsData : [];
              setCoffeeShops(shopsArray);
              
              const shop = shopsArray.find((s: any) => s.id === shopId);
              if (shop && shop.adress) {
                setCoffeeShopAddress(shop.adress);
              }
            }
          } catch (err) {
          }
        }
      }
      
      // Загружаем всех пользователей и расписание для ближайшей смены
      const { schedules } = await fetchAllUsersAndSchedules();
      // После загрузки расписаний загружаем отчет (чтобы можно было пересчитать смены)
      await fetchReport(schedules);
      
    } catch (err) {
      setShouldLogout(true);
    } finally {
      setLoading(false);
    }
  };

    fetchUser();
  }, []);

// Перезагружаем отчет при изменении периода или филиала
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (user) {
    const loadData = async () => {
      const { schedules } = await fetchAllUsersAndSchedules();
      await fetchReport(schedules);
      fetchSchedule();
    };
    loadData();
  }
  // fetchReport использует reportStartDate и reportEndDate, которые уже в зависимостях
  // selectedCoffeeShopId уже в зависимостях
}, [reportStartDate, reportEndDate, selectedCoffeeShopId, user]);

  const handleConfirmSchedule = async (scheduleId: number, startTime?: string, endTime?: string) => {
    // В ProfilePage подтверждение не требуется — только просмотр
    // Но если нужно — можно вызвать API
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    // В ProfilePage удаление не поддерживается — только просмотр
  };

  const handleCreateScheduleForUser = async (date: Date, startTime: string, endTime: string, targetUserId?: number) => {
    // В ProfilePage создание смен возможно только через модалку по клику на день
    // Но это уже обрабатывается в DayCell
  };

  const getShortName = (fullName: string) => {
    if (fullName.length <= 23) return fullName;
    return fullName.slice(0, 23) + "...";
  };

  // Форматирование имени в формате "Имя Ф. С." (где Ф - первая буква отчества, С - первая буква фамилии)
  const getNameWithPatronymicInitial = (firstName: string, lastName: string, patronymic: string | null | undefined): string => {
    if (!firstName) return "";
    const patronymicInitial = (patronymic && patronymic.trim()) ? patronymic.charAt(0).toUpperCase() + "." : "";
    const lastNameInitial = (lastName && lastName.trim()) ? lastName.charAt(0).toUpperCase() + "." : "";
    
    const parts = [firstName];
    if (patronymicInitial) parts.push(patronymicInitial);
    if (lastNameInitial) parts.push(lastNameInitial);
    
    return parts.join(" ");
  };

  const formatYears = (years: number) => {
    const lastDigit = years % 10;
    const lastTwo = years % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return `${years} лет`;
    if (lastDigit === 1) return `${years} год`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${years} года`;
    return `${years} лет`;
  };

  const getRoleText = (roleId: number): string => {
    switch (roleId) {
      case 1: return "Администратор";
      case 2: return "Менеджер";
      case 3: return "Бариста";
      default: return "Неизвестно";
    }
  };

  

  const getShortNameMobile = (firstName: string, lastName: string, patronymic: string): string => {
    if (!firstName) return "";
    
    // Проверяем, что отчество не пустое и не null
    const patronymicInitial = (patronymic && patronymic.trim()) ? patronymic.charAt(0).toUpperCase() + "." : "";
    
    // Если фамилия отсутствует или совпадает с именем, не добавляем её
    if (!lastName || lastName.trim() === "" || lastName.toLowerCase() === firstName.toLowerCase()) {
      return patronymicInitial ? `${firstName} ${patronymicInitial}`.trim() : firstName;
    }
    
    // Сокращаем фамилию до первой буквы, если она длинная
    const shortLastName = lastName.length > 8 
      ? lastName.charAt(0).toUpperCase() + "." 
      : lastName;
    
    return `${firstName} ${shortLastName}${patronymicInitial ? ` ${patronymicInitial}` : ""}`.trim();
  };

  const formatEarnings = (earnings: string): string => {
    try {
      const amount = parseFloat(earnings);
      return isNaN(amount) ? "0.00 ₽" : `${amount.toFixed(2)} ₽`;
    } catch {
      return "0.00 ₽";
    }
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
  };

  if (loading) {
    return <div className="profile-page profile-loading">Загрузка...</div>;
  }

  if (!user) {
    return <div className="profile-page">Ошибка загрузки данных</div>;
  }

  // Формирование ФИО
  const fullFIO = `${user.last_name} ${user.first_name}${user.patronymic ? ` ${user.patronymic}` : ""}`.trim();
  const shortFIO = getShortName(fullFIO);

  const NavButtons: React.FC = () => {
    const { pathname } = useLocation();
    const scheduleActive = pathname.startsWith("/schedule");
    const reportActive = pathname.startsWith("/report") || pathname.startsWith("/profile/report");

    return (
      <>
        <button className={`link-btn ${scheduleActive ? "active" : ""}`} onClick={() => navigate("/schedule")}>
          График работы
        </button>
        <button className={`link-btn ${reportActive ? "active" : ""}`} onClick={() => navigate("/report")}>
          Отчёт
        </button>
      </>
    );
  };

  return (
    <div className="profile-page">
      {/* Десктопный хедер */}
      <header className="profile-header desktop-header">
        <div className="desktop-header-left">
          <Icons.LogoIcon className="logo" title="logo" />
          {user && (
            <span className="account-owner">
              {getRoleText(user.role_id)} - {getShortNameMobile(user.first_name, user.last_name || "", user.patronymic || "")}
            </span>
          )}
          {/* Выпадающий список филиалов для роли 1 */}
          {user && (user.role_id === 1) ? (
            <CoffeeShopSelector
              selectedShopId={selectedCoffeeShopId}
              onShopChange={handleCoffeeShopChange}
              roleId={user.role_id}
              coffeeShops={coffeeShops}
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
              coffeeShops={coffeeShops}
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
        {/* Карточка сотрудника */}
        <section className="profile-card employee-main">
          <div className="photo-placeholder"></div>

          <div className="info-left desktop-info">
            <h2>{getRoleText(user.role_id)} - {getNameWithPatronymicInitial(user.first_name, user.last_name, user.patronymic)}</h2>

            <div className="info-column">
              <p><span>Начало работы:</span> {new Date(user.data_work_start).toLocaleDateString()}</p>
              <p><span>Уровень аттестации:</span> {user.assessment_rate}</p>
            </div>
          </div>

          <div className="info-right desktop-info">
            <div className="info-column">
              <p>
                <span>Почта:</span> 
                <span 
                  className={user.email.length > 30 ? "email-tooltip" : ""}
                  title={user.email.length > 30 ? user.email : ""}
                >
                  {user.email.length > 30 ? `${user.email.slice(0, 30)}...` : user.email}
                </span>
              </p>
              <p><span>Телефон:</span> {user.telephone}</p>
            </div>
          </div>

          <div className="mobile-info">
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
                    {getNameWithPatronymicInitial(user.first_name || "", user.last_name || "", user.patronymic) || user.first_name || "Пользователь"}
                  </span>
                </span>
              </div>
            </div>
            <div className="mobile-info-details">
              <p><span>Начало работы:</span> {new Date(user.data_work_start).toLocaleDateString()}</p>
              <p><span>Уровень аттестации:</span> {user.assessment_rate}</p>
              <p>
                <span>Почта:</span> 
                <span 
                  className={user.email.length > 30 ? "email-tooltip" : ""}
                  title={user.email.length > 30 ? user.email : ""}
                >
                  {user.email.length > 30 ? `${user.email.slice(0, 30)}...` : user.email}
                </span>
              </p>
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
                  {reportLoading ? "..." : (report?.work_days ?? 0)}
                </span>
              </div>
            </div>

            {/* Ближайшая смена — десктоп */}
            {getNextShift() && getEmployeesForNextShift().length > 0 && (
              <div className="report-next-shift-block desktop-next-shift">
                <div className="next-shift-employees">
                  {getEmployeesForNextShift().map((emp) => (
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

          {/* Ближайшая смена — мобильная версия */}
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
              {getEmployeesForNextShift().length > 0 && (
                <div className="next-shift-employees">
                  {getEmployeesForNextShift().map((emp) => (
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

        {/* === График работы с DayCell === */}
        <WorkSchedule
          currentLabel={
            isMobile
              ? getTwoWeeksLabel(currentDate)
              : getWeekLabel(currentDate)
          }
          mode={mode}
          onPrev={goPrev}
          onNext={goNext}
          onChangeMode={onChangeMode}
          isMobile={isMobile}
          onCalendarClick={isMobile ? () => setIsScheduleCalendarOpen(!isScheduleCalendarOpen) : undefined}
          calendarButtonRef={scheduleCalendarButtonRef}
          onSettingsClick={() => setIsSidebarOpen(true)}
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
                {d.time && (d as any).startTime && (d as any).endTime ? (
                  (d as any).shiftType === "evening" ? (
                    <>
                      {/* Вечерняя смена: начало сверху, конец снизу */}
                      <div className="day-cell-time day-cell-time-top">{(d as any).startTime}</div>
                      <div className="day-cell-time day-cell-time-bottom">{(d as any).endTime}</div>
                    </>
                  ) : (
                    <>
                      {/* Полная и утренняя смена: начало и конец сверху */}
                      <div className="day-cell-time day-cell-time-top">{(d as any).startTime}</div>
                      <div className="day-cell-time day-cell-time-top">{(d as any).endTime}</div>
                    </>
                  )
                ) : d.time ? (
                  <div className="day-time">{d.time}</div>
                ) : null}
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
                status: "Рабочая смена",
                schedule_start_time: formatLocalDateTime(modalDate, startTime),
                schedule_end_time: formatLocalDateTime(modalDate, endTime),
                is_confirmed: false
              };

              const res = await fetch("http://localhost:8000/api/v1/schedule/create_schedule", {
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
              if (user) {
                fetchSchedule();
                fetchReport();
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

        <ScheduleSettingsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSave={saveSchedules}
          currentUserId={Number(localStorage.getItem("user_id")) || null}
          coffeeShopId={user?.coffee_shop_id || null}
          roleId={Number(localStorage.getItem("role_id")) || 0}
          users={allUsers}
        />

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