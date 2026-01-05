import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/reportPage.css";
import * as Icons from "../icons/index.ts";
import CoffeeShopSelector from "./CoffeeShopSelector.tsx";
import { getMonthLabel } from "./useScheduleUtils.tsx";
import { computeReport, ReportRow } from "./useReportUtils.tsx";

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
      if (!res.ok || !Array.isArray(data)) {
        console.warn("Неверный ответ /all_users:", data);
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
        console.warn("Неверный ответ /schedule:", data);
        setSchedule([]);
        return;
      }
      setSchedule(data);
    } catch (e) {
      console.error("Ошибка /schedule:", e);
      setSchedule([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadSchedule()]);
      setLoading(false);
    })();
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

  return (
    <div className="manager-page">
      <header className="manager-header">
        <div className="logo-and-back">
          <Icons.LogoIcon className="logo" />
          {/* Выпадающий список филиалов для ролей 1 и 2 */}
          {(role_id === 1 || role_id === 2) && (
            <CoffeeShopSelector
              selectedShopId={selectedCoffeeShopId}
              onShopChange={handleCoffeeShopChange}
              roleId={role_id}
            />
          )}
        </div>

        <div className="manager-controls">
          <div className="desktop-header-right">
            <div className="nav-buttons">
              <button className={`link-btn ${scheduleActive ? "active" : ""}`} onClick={() => navigate("/schedule")}>График работы</button>
              <button className={`link-btn ${reportActive ? "active" : ""}`}>Отчёт</button>
            </div>

            <div className="period-controls">
              <div className="date-pill">{getMonthLabel(currentDate)}</div>
              <div className="arrows">
                <button onClick={goPrev} className="arrow">‹</button>
                <button onClick={goNext} className="arrow">›</button>
              </div>
            </div>
            
            <Icons.NotificationIcon className="notifications-icon" title="Уведомления" style={{ cursor: "pointer" }} />
            <Icons.SettingsIcon className="settings" />
            <Icons.ExitIcon className="logout" onClick={handleLogout} />
          </div>
        </div>
      </header>

      <main className="manager-container">
        <h2 className="manager-title">Отчёт</h2>

        <div className="report-table">
          <div className="report-header-row">
            <div className="col employee-col">Сотрудники</div>
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
            reportData.map(row => (
              <div key={row.user_id} className="report-row">
                <div className="col employee-col">
                  <div className="employee-card">
                    <div className="employee-name">{row.name}</div>
                    <div className="employee-role">{row.roleName || "Бариста"}</div>
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
    </div>
  );
};

export default ReportPage;
