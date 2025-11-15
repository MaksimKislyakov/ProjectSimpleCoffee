import { Link } from "react-router-dom";
import "../styles/workSchedule.css";
import * as Icons from "../icons/index.ts";

interface WorkScheduleProps {
  currentLabel: string;
  onPrev: () => void;
  onNext: () => void;
  mode: "week" | "month";
  onChangeMode: (mode: "week" | "month") => void;
  children: React.ReactNode;
}

export const WorkSchedule: React.FC<WorkScheduleProps> = ({
  currentLabel,
  onPrev,
  onNext,
  mode,
  onChangeMode,
  children
}) => {
  return (
    <section className="wrapper">
      {/* Заголовок */}
        <div className="header">
            <Link to="/schedule" className="title">
            График работы <Icons.ArrowIcon />
            </Link>
            <div className="currentPeriod">
                <div className="calendar">
                    <Icons.CalendarIcon title="календарь"/>
                    <span>{currentLabel}</span>
                </div>
                <div className="arrows">
                    <button onClick={onPrev} className="arrowBtn">
                        ‹
                    </button>
                    <button onClick={onNext} className="arrowBtn">
                        ›
                    </button>
                </div>
            </div>
            <div className="filters">
                <button
                className={`filterBtn ${mode === "week" ? "active" : ""}`}
                onClick={() => onChangeMode("week")}
                >
                Неделя
                </button>
                <button
                className={`filterBtn ${mode === "month" ? "active" : ""}`}
                onClick={() => onChangeMode("month")}
                >
                Месяц
                </button>
                <Icons.SettingsIcon className="settingsBtn"/>
            </div>
        </div>

      {/* Сетка расписания */}
      <div className={`scheduleGrid ${mode === "month" ? "month-view" : ""}`}>
        {children}
      </div>
    </section>
  );
};

export default WorkSchedule;