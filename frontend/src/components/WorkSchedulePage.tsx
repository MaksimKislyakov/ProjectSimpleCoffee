// src/pages/WorkSchedulePage.tsx

import React, { useEffect, useState, } from "react"
import WorkScheduleHeader from "../components/WorkScheduleHeader.tsx"
import WorkScheduleTable from "../components/WorkScheduleTable.tsx"
import { DayData, generateWeekDays, generateMonthDays } from "../components/useScheduleUtils.tsx"
import "../styles/workSchedulePage.css"
import * as Icons from "../icons/index.ts"
import { useNavigate } from "react-router-dom";

const WorkSchedulePage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mode, setMode] = useState<"week" | "month">("month")
  const [days, setDays] = useState<DayData[]>([]);
  const [shouldLogout, setShouldLogout] = useState(false)

  const token = localStorage.getItem("token")

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
    const res = await fetch("/api/v1/schedule/", {
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


  useEffect(() => {
    loadUsers()
    loadSchedule()
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

  return (
    <div className="work-schedule-page">
      {/* Верхняя панель */}
            <header className="profile-header">
              <Icons.LogoIcon className="logo" title="logo" />
              <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти" />
            </header>
      <div className="container-page">
        <WorkScheduleHeader
          currentDate={currentDate}
          mode={mode}
          onPrev={prev}
          onNext={next}
          onModeChange={setMode}
        />

        <WorkScheduleTable
          users={users}
          schedule={schedule}
          days={days}
        />
        </div>
    </div>
  )
}

export default WorkSchedulePage
