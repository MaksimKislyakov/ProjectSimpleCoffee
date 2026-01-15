import { useNavigate } from "react-router-dom";
import React from "react";
import "../styles/workSchedule.css";
import * as Icons from "../icons/index.ts";

interface WorkScheduleProps {
  currentLabel: string;
  onPrev: () => void;
  onNext: () => void;
  mode: "week" | "month";
  onChangeMode: (mode: "week" | "month") => void;
  children: React.ReactNode;
  isMobile?: boolean;
  onCalendarClick?: () => void;
  calendarButtonRef?: React.RefObject<HTMLDivElement | null>;
  onSettingsClick?: () => void;
}


export const WorkSchedule: React.FC<WorkScheduleProps> = ({
  currentLabel,
  onPrev,
  onNext,
  mode,
  onChangeMode,
  children,
  isMobile,
  onCalendarClick,
  calendarButtonRef,
  onSettingsClick,
}) => {
  const navigate = useNavigate();
  return (
    <section className="wrapper">
      {/* Заголовок */}
        <div className="header">
            <div className="go-to-schedule" onClick={() => navigate("/schedule")}>
              <p>График работы</p> <Icons.ArrowIcon />
            </div>
            <div className="currentPeriod">
                <div 
                  ref={calendarButtonRef}
                  className="calendar"
                  onClick={isMobile && onCalendarClick ? onCalendarClick : undefined}
                  style={isMobile && onCalendarClick ? { cursor: 'pointer' } : undefined}
                >
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
                {isMobile && (
                  <>
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
                  </>
                )}
                <Icons.SettingsIcon 
                  className="settingsBtn" 
                  onClick={onSettingsClick}
                  style={onSettingsClick ? { cursor: "pointer" } : undefined}
                />
            </div>
        </div>

      {/* Заголовок дней недели (если есть в children) */}
      {React.Children.toArray(children).find((child) => 
        React.isValidElement(child) && 
        (child.props as { className?: string })?.className === 'schedule-weekdays-header'
      )}

      {/* Сетка расписания */}
      <div className={`scheduleGrid ${mode === "month" ? "month-view" : ""}`}>
        {React.Children.toArray(children).filter((child) => 
          !(React.isValidElement(child) && (child.props as { className?: string })?.className === 'schedule-weekdays-header')
        )}
      </div>
    </section>
  );
};

export default WorkSchedule;