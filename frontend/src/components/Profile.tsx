import React, { useEffect, useState } from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate } from "react-router-dom";
import WorkSchedule from "./WorkSchedule.tsx";

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
  time?: string;
  isWorkDay?: boolean;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldLogout, setShouldLogout] = useState(false);
  const [mode, setMode] = useState<"week" | "month">("week");

  const [days, setDays] = useState<DayData[]>([
    { date: "Пн 17", time: "09:00 18:00", isWorkDay: true },
    { date: "Вт 18", time: "09:00 18:00", isWorkDay: true },
    { date: "Ср 19", time: "09:00 18:00" },
    { date: "Чт 20", time: "09:00 18:00" },
    { date: "Пт 21", time: "09:00 18:00" },
    { date: "Сб 22" },
    { date: "Вс 23" }
  ]);

  /** === Подгрузка пользователя с backend === **/
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
        
      } catch (err) {
        console.error(err);
        setShouldLogout(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

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

  useEffect(() => {
    if (shouldLogout) {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [shouldLogout, navigate]);

  const handleLogout = () => setShouldLogout(true);

  const goPrev = () => console.log("Предыдущий период");
  const goNext = () => console.log("Следующий период");

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

  /** === Компонент дня === **/
  const DayCard: React.FC<{ day: DayData }> = ({ day }) => (
    <div className={`day-card ${day.isWorkDay ? "isWorkDay" : ""}`}>
      <div className="day-header">
        <div className="date">{day.date}</div>
      </div>
      <div className={`time-slots ${day.isWorkDay ? "isWorkDay" : ""}`}>
        {day.time && <div className="time">{day.time}</div>}
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      {/* Верхняя панель */}
      <header className="profile-header">
        <Icons.LogoIcon className="logo" title="logo" />
        <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти" />
      </header>

      <main className="profile-content">
        {/* Информация о сотруднике */}
        <section className="profile-card employee-main">
          <div className="photo-placeholder"></div>

          <div className="info-left">
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

            <p><p>Должность:</p> {user.role_id === 1 ? "Бариста" : "Сотрудник"}</p>
            <p><p>Почта:</p> {user.email}</p>
            <p><p>Телефон:</p> {user.telephone}</p>
          </div>

          <div className="info-right">
            <p><p>Опыт работы:</p> {formatYears(user.work_experience)}</p>
            <p><p>Уровень аттестации:</p> {user.assessment_rate}</p>
            <p><p>Часовая ставка:</p> {Number(user.hourly_rate)} ₽</p>
            <p><p>Начало работы:</p> {new Date(user.data_work_start).toLocaleDateString()}</p>
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

        {/* Отчёт текущего месяца */}
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
