import React, { useEffect, useState } from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate } from "react-router-dom";
import WorkSchedule from "./WorkSchedule.tsx";

// Создаем моковые данные для тестирования
const mockUser: UserData = {
  first_name: "Иван",
  last_name: "Иванов",
  patronymic: "Иванович",
  email: "mymail@mail.ru",
  telephone: "+7 987 654 32 10",
  role_id: 1,
  hourly_rate: "250",
  assessment_rate: 4,
  work_experience: 1,
  id: 1,
  data_work_start: 1735699200000 // timestamp для 01.01.2025
};

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
}

interface DayData {
  date: string;
  time?: string; // опциональное время смены
  isActive?: boolean; // активный день
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(mockUser); // Используем моковые данные
  const [loading, setLoading] = useState(false); // Устанавливаем false для теста
  const [mode, setMode] = useState<"week" | "month">("week");
 const [days, setDays] = useState<DayData[]>([
  { date: "Пн 17", time: "09:00-18:00", isActive: true },
  { date: "Вт 18", time: "09:00-18:00", isActive: true },
  { date: "Ср 19", time: "09:00-18:00" },
  { date: "Чт 20", time: "09:00-18:00" },
  { date: "Пт 21", time: "09:00-18:00" },
  { date: "Сб 22" }, // выходной
  { date: "Вс 23" }, // выходной
]);

  const goPrev = () => {
    console.log("Предыдущий период");
    // Реализуйте логику переключения периода
  };

  const goNext = () => {
    console.log("Следующий период");
    // Реализуйте логику переключения периода
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // ЗАКОММЕНТИРУЙТЕ ВЕСЬ useEffect для тестирования
  /*
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const res = await fetch("/api/v1/user/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          },
        });

        if (!res.ok) {
          throw new Error("Ошибка загрузки данных пользователя");
        }

        const data: UserData = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  */

  // Закомментируйте проверку загрузки
  /*
  if (loading) {
    return <div className="profile-page">Загрузка...</div>;
  }

  if (!user) {
    return <div className="profile-page">Ошибка загрузки данных</div>;
  }
  */

  // Временный компонент для отображения дней
const DayCard: React.FC<{ day: DayData }> = ({ day }) => (
  <div className={`day-card ${day.isActive ? 'active' : ''}`}>
    <div className="day-header">
      <div className="date">{day.date}</div>
    </div>
    <div className={`time-slots ${day.isActive ? 'active' : ''}`}>
    {day.time && <div className="time">{day.time}</div>}
    </div>
  </div>
);

  return (
    <div className="profile-page">
      {/* Верхняя панель */}
      <header className="profile-header">
          <Icons.LogoIcon className="logo" title="logo" />
          <div className="navigation-bar">
            <button className="navigation-btn active">График работы</button>
            <button className="navigation-btn">Отчёт</button>
            <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти"/>
          </div>
      </header>

      {/* Основное содержимое */}
      <main className="profile-content">
        {/* Информация о сотруднике */}
        <section className="profile-card employee-main">
          <div className="photo-placeholder"></div>
          <div className="employee-info">
            <h2>Информация о сотруднике</h2>
            <div className="employee-columns">
              <div className="info-left">
                <p><strong>ФИО:</strong> {user?.last_name} {user?.first_name} {user?.patronymic}</p>
                <p><strong>Должность:</strong> {user?.role_id === 1 ? "Бариста" : "Сотрудник"}</p>
                <p><strong>Почта:</strong> {user?.email}</p>
                <p><strong>Телефон:</strong> {user?.telephone}</p>
              </div>
              <div className="info-right">
                <p><strong>Опыт работы:</strong> {user?.work_experience} лет</p>
                <p><strong>Уровень аттестации:</strong> {user?.assessment_rate}</p>
                <p><strong>Часовая ставка:</strong> {Number(user?.hourly_rate)} ₽</p>
                <p><strong>Начало работы:</strong> {new Date(user?.data_work_start || 0).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Отчёт */}
        <section className="profile-card report">
          <div className="report-header">
            <h2>Отчёт</h2>
            <div className="report-container">
              <div className="date-pill">
                <Icons.CalendarWhiteIcon title="calendar" />
                <span>1–7 Января 2000</span>
              </div>
              <Icons.ArrowsIcon title="arrows" />
            </div>
          </div>

          <div className="report-stats">
            <div className="stat-card">
              <div className="stat-container">
                <Icons.TimeIcon width={20} height={20} title="time" />
                <p>Рабочие часы</p>
              </div>
              <h3>156</h3>
            </div>
            <div className="stat-card">
              <div className="stat-container">
                <Icons.BriefcaseIcon width={20} height={20} title="briefcase" />
                <p>Смены</p>
              </div>
              <h3>13</h3>
            </div>
            <div className="stat-card">
              <div className="stat-container">
                <Icons.RubleIcon width={20} height={20} title="ruble" />
                <p>Заработок</p>
              </div>
              <h3>40000 ₽</h3>
            </div>
          </div>
        </section>

        {/* Отчёт на текущий месяц */}
        <section className="profile-card month-summary">
          <h2>Отчёт на текущий месяц</h2>
          <p><strong>Заработок:</strong> 0.00 ₽</p>
          <p><strong>Премии:</strong> 0.00 ₽</p>
          <p><strong>Штрафы:</strong> 0.00 ₽</p>
          <div className="next-shift">
            <p>Ближайшая смена:</p>
            <p className="date-pill orange">02.01.2025</p>
          </div>
        </section>

        <WorkSchedule
          currentLabel="1–7 Январь 2000"
          mode={mode}
          onPrev={goPrev}
          onNext={goNext}
          onChangeMode={setMode}
        >
          {days.map((day, index) => (
            <DayCard key={index} day={day} />
          ))}
        </WorkSchedule>
      </main>
    </div>
  );
};

export default ProfilePage;