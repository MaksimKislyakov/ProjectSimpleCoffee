import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/reportPage.css";
import * as Icons from "../icons/index.ts";
import CoffeeShopSelector from "./CoffeeShopSelector.tsx";
import { getMonthLabel } from "./useScheduleUtils.tsx";
import { computeReport, ReportRow } from "./useReportUtils.tsx";
import ReportDateRangePicker from "./ReportDateRangePicker.tsx";
import ReportSettingsSidebar from "./ReportSettingsSidebar.tsx";

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [selectedCoffeeShopId, setSelectedCoffeeShopId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedCoffeeShopId");
    return saved ? parseInt(saved, 10) : null;
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarButtonRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState(false);
  const [coffeeShops, setCoffeeShops] = useState<any[]>([]);

  const token = localStorage.getItem("token") || "";
  const role_id = Number(localStorage.getItem("role_id"));

  // Обработчик изменения филиала
  const handleCoffeeShopChange = (shopId: number) => {
    setSelectedCoffeeShopId(shopId);
    localStorage.setItem("selectedCoffeeShopId", shopId.toString());
    // Перезагружаем данные
    loadUsers();
    loadSchedule();
  };

  const { pathname } = useLocation();
  const scheduleActive = pathname.startsWith("/schedule");
  const reportActive = pathname.startsWith("/report") || pathname.startsWith("/profile/report");

  useEffect(() => {
    if (role_id === 3) {
      navigate("/profile");
    }
  }, [role_id, navigate]);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/v1/user/all_users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      // Если API вернул ошибку — игнорируем
      if (!res.ok || !Array.isArray(data)) {
        console.warn("Некорректный ответ /all_users:", data);
        setUsers([]);
        return;
      }

      // Фильтруем пользователей по выбранному филиалу, если он выбран
      const filteredUsers = selectedCoffeeShopId 
        ? data.filter((u: any) => u.coffee_shop_id === selectedCoffeeShopId)
        : data;
      
      setUsers(filteredUsers);
    } catch (e) {
      console.error("Ошибка /all_users:", e);
      setUsers([]);
    }
  };

  const loadSchedule = async () => {
    try {
      const res = await fetch("/api/v1/schedule/get_all_schedule", {
        headers: { Authorization: `Bearer ${token}` },
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

  const loadCoffeeShops = async () => {
    try {
      const res = await fetch("/api/v1/coffee_shop/get_coffee_shops", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoffeeShops(Array.isArray(data) ? data : []);
      } else {
        setCoffeeShops([]);
      }
    } catch (e) {
      console.error("Ошибка при загрузке кофеен:", e);
      setCoffeeShops([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadSchedule(), loadCoffeeShops()]);
      setLoading(false);
    })();
    // Загружаем текущего пользователя
    const loadCurrentUser = async () => {
      try {
        const res = await fetch("/api/v1/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
        }
      } catch (e) {
        console.error("Ошибка загрузки текущего пользователя:", e);
      }
    };
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoffeeShopId]);

  // пересчитываем отчёт при изменении данных / даты
    useEffect(() => {
      setReportData(computeReport(users, schedule, currentDate));
    }, [users, schedule, currentDate]);
    
  const goPrev = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role_id");
    navigate("/");
  };

  const handleMonthChange = (startDate: Date, endDate: Date) => {
    // Используем начало месяца из startDate
    setCurrentDate(startDate);
    setIsCalendarOpen(false);
  };

  // Фильтруем данные отчета по поиску
  const filteredReportData = reportData.filter(row => {
    const fullName = `${row.name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

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

  // Форматирование имени в формате "Имя Ф."
  const getShortName = (firstName: string, lastName: string): string => {
    if (!firstName) return "";
    const lastNameInitial = lastName ? lastName.charAt(0).toUpperCase() + "." : "";
    return lastNameInitial ? `${firstName} ${lastNameInitial}` : firstName;
  };

  return (
    <div className="manager-page">
      <header className="manager-header desktop-header">
        <div className="desktop-header-left">
          <Icons.LogoIcon className="logo" title="logo" />
          {currentUser && (
            <span style={{ 
              color: "#3F3932", 
              fontFamily: "Montserrat",
              fontWeight: 600,
              fontSize: "20px",
              lineHeight: "100%",
              letterSpacing: "0%"
            }}>
              {getRoleText(currentUser.role_id)} - {getShortName(currentUser.first_name, currentUser.last_name || "")}
            </span>
          )}
          {/* Выпадающий список филиалов для ролей 1 и 2 */}
          {(role_id === 1 || role_id === 2) && (
            <CoffeeShopSelector
              selectedShopId={selectedCoffeeShopId}
              onShopChange={handleCoffeeShopChange}
              roleId={role_id}
            />
          )}
        </div>

        <div className="desktop-header-right">
          {(role_id === 1 || role_id === 2) && (
            <div className="manager-controls">
              <div className="nav-buttons">
                <button className={`link-btn ${scheduleActive ? "active" : ""}`} onClick={() => navigate("/schedule")}>График работы</button>
                <button className={`link-btn ${reportActive ? "active" : ""}`}>Отчёт</button>
              </div>
            </div>
          )}
          <Icons.NotificationIcon className="notifications-icon" title="Уведомления" style={{ cursor: "pointer" }} />
          <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти" />
        </div>
      </header>

      <main className="manager-container">
        <div className="report-table">
          <div className="report-header-controls">
            <h2 className="manager-title">Отчёт</h2>
            <div className="period-controls">
              <div className="controls">
              <div 
                ref={calendarButtonRef}
                className="date-pill"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                style={{ cursor: "pointer" }}
              >
                <Icons.CalendarWhiteIcon />
                {getMonthLabel(currentDate)} {currentDate.getFullYear()}
              </div>
              <div className="arrows">
                <button onClick={goPrev} className="arrow">‹</button>
                <button onClick={goNext} className="arrow">›</button>
              </div>
              </div>
              {(role_id === 1 || role_id === 2) && (
                <Icons.ReportSettingsIcon 
                  className="settings-icon" 
                  onClick={() => setIsSettingsSidebarOpen(true)}
                  style={{ cursor: "pointer" }}
                />
              )}
            </div>
            {isCalendarOpen && (
              <ReportDateRangePicker
                startDate={currentDate}
                endDate={(() => {
                  const end = new Date(currentDate);
                  end.setMonth(end.getMonth() + 1);
                  end.setDate(0);
                  return end;
                })()}
                onDateChange={handleMonthChange}
                onClose={() => setIsCalendarOpen(false)}
                buttonRef={calendarButtonRef}
              />
            )}
          </div>
          <div className="report-header-row">
            <div className="col employee-col">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span>Сотрудники</span>
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col">Смены</div>
            <div className="col">Рабочие часы</div>
            <div className="col">Заработок</div>
            <div className="col">Штрафы</div>
            <div className="col">Премии</div>
            <div className="col">Итого</div>
          </div>

          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            filteredReportData.map(row => (
              <div key={row.user_id} className="report-row">
                <div className="col employee-col">
                  <div className="employee-card">
                    <p className="employee-name">{row.name}</p>
                    <p className="employee-role">{row.roleName || "Бариста"}</p>
                  </div>
                </div>

                <div className="col">{row.shifts}</div>
                <div className="col">{row.work_hours.toFixed(2)}</div>
                <div className="col">{row.earningsFormatted}</div>
                <div className="col">{row.finesFormatted}</div>
                <div className="col">{row.bonusesFormatted}</div>
                <div className="col">{row.totalFormatted}</div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Settings Sidebar */}
      <ReportSettingsSidebar
        isOpen={isSettingsSidebarOpen}
        onClose={() => setIsSettingsSidebarOpen(false)}
        coffeeShops={coffeeShops}
        users={users}
        token={token}
        onUserCreated={() => {
          loadUsers();
          loadCoffeeShops();
        }}
        onCoffeeShopCreated={() => {
          loadCoffeeShops();
          loadUsers();
        }}
      />
    </div>
  );
};

export default ReportPage;
