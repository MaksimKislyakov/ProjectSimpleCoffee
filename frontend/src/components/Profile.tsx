import React, { useEffect, useState, useRef } from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate, useLocation } from "react-router-dom";
import WorkSchedule from "./WorkSchedule.tsx";
import AddScheduleModal from "./AddScheduleModal.tsx";
import ConfirmScheduleModal from "./ConfirmScheduleModal.tsx";
import {
  DayData,
  generateWeekDays,
  generateMonthDays,
  getWeekLabel,
  getMonthLabel
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

interface ScheduleItem {
  id: number;
  user_id: number;
  coffee_shop_id: number;
  status: string;
  schedule_start_time: string;
  schedule_end_time: string;
  is_confirmed: boolean;
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);

  const [days, setDays] = useState<DayData[]>([]);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Модальные состояния для DayCell
  const [openModalScheduleId, setOpenModalScheduleId] = useState<number | null>(null);
  const [openAddModalKey, setOpenAddModalKey] = useState<string | null>(null);

  const fetchSchedule = async () => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setScheduleLoading(true);

    try {
      // Генерируем пустые дни
      let emptyDays: DayData[] = [];
      if (mode === "week") {
        emptyDays = generateWeekDays(currentDate);
      } else {
        emptyDays = generateMonthDays(currentDate);
      }

      const res = await fetch("/api/v1/schedule/get_all_schedule", {
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

        return {
          ...emptyDay,
          schedule: scheduleItem || null,
          isEmpty: !scheduleItem
        };
      });

      setDays(updatedDays);
    } catch (err) {
      console.error("Ошибка получения расписания", err);
      const errorDays = mode === "week" ? generateWeekDays(currentDate) : generateMonthDays(currentDate);
      setDays(errorDays.map(day => ({ ...day, isEmpty: true })));
    } finally {
      setScheduleLoading(false);
    }
  };

  const fetchReport = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShouldLogout(true);
      return;
    }

    try {
      // Вычисляем период: текущий месяц
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const res = await fetch(
        `/api/v1/report/get_my_report?start_date=${startOfMonth.toISOString()}&end_date=${endOfMonth.toISOString()}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Ошибка загрузки отчета:", res.status);
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
      const usersRes = await fetch("/api/v1/user/all_users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(Array.isArray(usersData) ? usersData : []);
      }

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

  // === БЛИЖАЙШАЯ СМЕНА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ===
const getNextShift = () => {
  if (!user || !allSchedules.length) return null;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Начало дня

  const userSchedules = allSchedules
    .filter((s: any) => 
      s.user_id === user.id && 
      s.schedule_start_time && 
      s.is_confirmed // Только подтверждённые смены
    )
    .map((s: any) => ({
      ...s,
      date: new Date(s.schedule_start_time)
    }))
    .filter((s: any) => s.date >= now) // Будущие или сегодняшние
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
          isCurrentUser: employee.id === user.id // Для выделения текущего пользователя
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

  const getCurrentPeriod = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
                    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const month = months[now.getMonth()];
    return `${firstDay.getDate()}-${lastDay.getDate()} ${month} ${now.getFullYear()}`;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setShouldLogout(true);
        return;
      }

      try {
        const res = await fetch("/api/v1/user/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
          setShouldLogout(true);
          return;
        }

        const data: UserData = await res.json();
        setUser(data);

        if (data.coffee_shop_id) {
          const shopRes = await fetch("/api/v1/coffee_shop/get_coffee_shops", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (shopRes.ok) {
            const shops = await shopRes.json();
            const shop = Array.isArray(shops) ? shops.find((s: any) => s.id === data.coffee_shop_id) : null;
            if (shop?.adress) setCoffeeShopAddress(shop.adress);
          }
        }

        await fetchReport();
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

  useEffect(() => {
    if (user) fetchSchedule();
  }, [user, mode, currentDate]);

  const handleAddSchedule = async (data: any) => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const body = {
      user_id: user.id,
      coffee_shop_id: user.coffee_shop_id,
      status: data.status,
      schedule_start_time: data.schedule_start_time,
      schedule_end_time: data.schedule_end_time,
      is_confirmed: false
    };

    try {
      const response = await fetch("/api/v1/schedule/create_schedule", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Ошибка создания смены');

      setModalDate(null);
      await fetchSchedule();
      await fetchReport();
    } catch (err) {
      console.error("Ошибка добавления расписания", err);
    }
  };

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
    return fullName.length <= 23 ? fullName : fullName.slice(0, 23) + "...";
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
    const patronymicInitial = patronymic ? patronymic.charAt(0).toUpperCase() + "." : "";
    if (!lastName || lastName.trim() === "" || lastName.toLowerCase() === firstName.toLowerCase()) {
      return patronymicInitial ? `${firstName} ${patronymicInitial}`.trim() : firstName;
    }
    const shortLastName = lastName.length > 8 ? lastName.charAt(0).toUpperCase() + "." : lastName;
    return `${firstName} ${shortLastName} ${patronymicInitial}`.trim();
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
    if (mode === "week") newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goNext = () => {
    const newDate = new Date(currentDate);
    if (mode === "week") newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const onChangeMode = (newMode: "week" | "month") => {
    setMode(newMode);
  };

  if (loading) {
    return <div className="profile-page">Загрузка...</div>;
  }

  if (!user) {
    return <div className="profile-page">Ошибка загрузки данных</div>;
  }

  const fullFIO = `${user.last_name} ${user.first_name} ${user.patronymic}`;
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
          {coffeeShopAddress && <span className="desktop-coffee-shop-address">{coffeeShopAddress}</span>}
        </div>
        {(user.role_id === 1 || user.role_id === 2) && (
          <div className="manager-controls">
            <div className="nav-buttons"><NavButtons /></div>
          </div>
        )}
        <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти" />
      </header>

      {/* Мобильный хедер */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <Icons.LogoIcon className="mobile-logo" title="logo" />
          {coffeeShopAddress && <span className="mobile-coffee-shop-address">{coffeeShopAddress}</span>}
        </div>
        <div className="mobile-header-right">
          <div className="mobile-notifications-icon" />
          <Icons.ExitIcon className="mobile-logout-icon" onClick={handleLogout} title="Выйти" />
        </div>
      </header>

      <main className="profile-content">
        {/* Карточка сотрудника */}
        <section className="profile-card employee-main">
          <div className="photo-placeholder"></div>

          <div className="info-left desktop-info">
            <h2>Информация о сотруднике</h2>
            <div className="fio-wrapper">
              <p className="fio-label">ФИО:</p>
              <div className="fio-container">
                <span className="fio-text">{shortFIO}</span>
                <div className="fio-popup">{fullFIO}<div className="fio-popup-arrow"></div></div>
              </div>
            </div>
            <p><span>Должность:</span> {getRoleText(user.role_id)}</p>
            <p><span>Почта:</span> {user.email}</p>
            <p><span>Телефон:</span> {user.telephone}</p>
          </div>

          <div className="info-right desktop-info">
            <p><span>Опыт работы:</span> {formatYears(user.work_experience)}</p>
            <p><span>Уровень аттестации:</span> {user.assessment_rate}</p>
            <p><span>Начало работы:</span> {new Date(user.data_work_start).toLocaleDateString()}</p>
          </div>

          <div className="mobile-info">
            <div className="mobile-employee-info">
              <div className="mobile-employee-avatar">
                <div className="avatar-circle">
                  {user.first_name ? user.first_name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
              <div className="mobile-employee-details">
                <span className="mobile-employee-role-name">
                  <span className="mobile-employee-role">{getRoleText(user.role_id)}</span>
                  <span className="mobile-employee-separator"> - </span>
                  <span className="mobile-employee-name">
                    {getShortNameMobile(user.first_name, user.last_name, user.patronymic) || user.first_name || "Пользователь"}
                  </span>
                </span>
              </div>
            </div>
            <div className="mobile-info-details">
              <p><span>Начало работы:</span> {new Date(user.data_work_start).toLocaleDateString()}</p>
              <p><span>Уровень аттестации:</span> {user.assessment_rate}</p>
              <p><span>Почта:</span> {user.email}</p>
              <p><span>Телефон:</span> {user.telephone}</p>      
            </div>
          </div>
        </section>

        {/* Отчёт */}
        <section className="profile-card report">
          <div className="report-header">
            <h2 className="report-title">Отчёт</h2>
            <div className="report-calendar-controls">
              <div className="report-calendar-button">
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
          currentLabel={mode === "week" ? getWeekLabel(currentDate) : getMonthLabel(currentDate)}
          mode={mode}
          onPrev={goPrev}
          onNext={goNext}
          onChangeMode={onChangeMode}
          days={days}
          user={user}
          currentUserId={user.id}
          currentRoleId={user.role_id}
          onConfirmSchedule={handleConfirmSchedule}
          onDeleteSchedule={handleDeleteSchedule}
          onCreateSchedule={handleCreateScheduleForUser}
          openModalScheduleId={openModalScheduleId}
          setOpenModalScheduleId={setOpenModalScheduleId}
          openAddModalKey={openAddModalKey}
          setOpenAddModalKey={setOpenAddModalKey}
        />

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
              if (user) {
                fetchSchedule();
                fetchReport();
              }
            }}
            onClose={() => setModalDate(null)}
          />
        )}
      </main>
    </div>
  );
};

export default ProfilePage;