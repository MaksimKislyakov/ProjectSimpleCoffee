import React, { useEffect, useState } from "react";
import "../styles/profile.css";
import * as Icons from "../icons/index.ts";
import { useNavigate } from "react-router-dom";
import WorkSchedule from "./WorkSchedule.tsx";
import AddScheduleModal from "./AddScheduleModal.tsx";
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


const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldLogout, setShouldLogout] = useState(false);
  const [mode, setMode] = useState<"week" | "month">("week");

  const [days, setDays] = useState<DayData[]>([]);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());


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

  const fetchSchedule = async () => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setScheduleLoading(true);

    try {
      // Сначала генерируем пустые дни для текущего режима
      let emptyDays: DayData[] = [];
      if (mode === "week") {
        emptyDays = generateWeekDays(currentDate);
      } else {
        emptyDays = generateMonthDays(currentDate);
      }

      const res = await fetch("/api/v1/schedule/", {
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
      console.log("Полученное расписание:", schedule);

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

          return {
            ...emptyDay,
            date: emptyDay.date, // Сохраняем исходную дату
            time: `${formatTime(start)} ${formatTime(end)}`,
            isWorkDay: scheduleItem.status === "active",
            isEmpty: false // Есть данные - не пустой
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
      const errorDays = mode === "week" ? generateWeekDays() : generateMonthDays();
      setDays(errorDays.map(day => ({ ...day, isEmpty: true })));
    } finally {
      setScheduleLoading(false);
    }
  };

useEffect(() => {
  if (user) fetchSchedule();
}, [user, mode, currentDate]);

const handleAddSchedule = async (data: any) => {
  if (!user) return;
  const token = localStorage.getItem("token");

  const body = {
    user_id: user?.id,            // обязательно
    coffee_shop_id: user?.coffee_shop_id,
    status: data.status,
    schedule_start_time: data.schedule_start_time,
    schedule_end_time: data.schedule_end_time
  };

  try {
    await fetch("/api/v1/schedule/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    // Закрываем модалку
    setModalDate(null);
    await fetchSchedule();

    // Перезагружаем расписание
    if (mode === "week") {
      setDays(generateWeekDays(currentDate));
    } else {
      setDays(generateMonthDays(currentDate));
    }

  } catch (err) {
    console.error("Ошибка добавления расписания", err);
  }
};


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

 const goPrev = () => {
  const newDate = new Date(currentDate);
  if (mode === "week") newDate.setDate(newDate.getDate() - 7);
  else newDate.setMonth(newDate.getMonth() - 1);
  setCurrentDate(newDate);
};

  const goNext = () => {
  const newDate = new Date(currentDate);
  if (mode === "week") {
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

/** === Компонент дня === **/
const DayCard: React.FC<{ day: DayData }> = ({ day }) => (
  <div className={`day-card ${day.isWorkDay ? "isWorkDay" : ""} ${day.isEmpty ? "isEmpty" : ""}`}
    onClick={() => setModalDate(day.fullDate)}
  >
    <div className="day-header">
      <div className="date">{day.date}</div>
    </div>
    <div className={`time-slots ${day.isWorkDay ? "isWorkDay" : ""} ${day.isEmpty ? "isEmpty" : ""}`}>
      {!day.isEmpty && day.time ? (
        <div className="time">{day.time}</div>
      ) : ("")}
    </div>
    <div className="day-icon">
      {day.status === "active" && <Icons.BriefcaseIcon />}
      {day.status === "vacation" && <Icons.VacationIcon />}
      {day.status === "sick" && <Icons.MedicalIcon />}
    </div>
    <div className="comment-popup">{day.comment}</div>
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
          currentLabel={mode === "week" ? getWeekLabel(currentDate) : getMonthLabel(currentDate)}
          mode={mode}
          onPrev={goPrev}
          onNext={goNext}
          onChangeMode={onChangeMode}
        >
          {days.map((day, index) => (
            <DayCard key={index} day={day} />
          ))}
        </WorkSchedule>
        <AddScheduleModal
          date={modalDate}
          onClose={() => setModalDate(null)}
          onSubmit={handleAddSchedule}
        />

      </main>
    </div>
  );
};

export default ProfilePage;
