import React, { useEffect, useState } from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate } from "react-router-dom";

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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

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

    if (loading) {
    return <div className="profile-page">Загрузка...</div>;
  }

    if (!user) {
    return <div className="profile-page">Ошибка загрузки данных</div>;
  }

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
                <p><p>ФИО:</p> {user.last_name} {user.first_name} {user.patronymic}</p>
                <p><p>Должность:</p> {user.role_id === 1 ? "Бариста" : "Сотрудник"}</p>
                <p><p>Почта:</p> {user.email}</p>
                <p><p>Телефон:</p> {user.telephone}</p>
              </div>
              <div className="info-right">
                <p><p>Опыт работы:</p> {user.work_experience} лет</p>
                <p><p>Уровень аттестации:</p> {user.assessment_rate}</p>
                <p><p>Часовая ставка:</p> {Number(user.hourly_rate)} ₽</p>
                <p><p>Начало работы:</p> {user.data_work_start}</p>
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
          <p><p>Заработок:</p> 0.00 ₽</p>
          <p><p>Премии:</p> 0.00 ₽</p>
          <p><p>Штрафы:</p> 0.00 ₽</p>
          <div className="next-shift">
            <p>Ближайшая смена:</p>
            <p className="date-pill orange">02.01.2025</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
