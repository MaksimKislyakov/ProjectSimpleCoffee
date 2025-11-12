import React from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="profile-page">
      {/* Верхняя панель */}
      <header className="profile-header">
          <Icons.LogoIcon className="logo" title="logo" />
          <Icons.ExitIcon className="logout-icon" onClick={handleLogout} title="Выйти"/>
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
                <p><p>ФИО:</p> Иванов Иван Иванович</p>
                <p><p>Должность:</p> Бариста</p>
                <p><p>Почта:</p> mymail@mail.ru</p>
                <p><p>Телефон:</p> +7 987 654 32 11</p>
              </div>
              <div className="info-right">
                <p><p>Опыт работы:</p> 1 год</p>
                <p><p>Уровень аттестации:</p> 1</p>
                <p><p>Часовая ставка:</p> 250 ₽</p>
                <p><p>Начало работы:</p> 01.01.2025</p>
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
