// src/components/WorkSchedule.tsx
import { useNavigate } from "react-router-dom";
import React from "react";
import "../styles/workSchedule.css";
import * as Icons from "../icons/index.ts";
import { DayCell } from "./DayCell.tsx";
import { DayData } from "./useScheduleUtils.tsx";

interface WorkScheduleProps {
  currentLabel: string;
  onPrev: () => void;
  onNext: () => void;
  mode: "week" | "month";
  onChangeMode: (mode: "week" | "month") => void;
  days: DayData[];
  user: any;
  currentUserId: number;
  currentRoleId: number;
  onConfirmSchedule: (scheduleId: number, startTime?: string, endTime?: string) => Promise<void>;
  onDeleteSchedule?: (scheduleId: number) => Promise<void>;
  onCreateSchedule?: (date: Date, startTime: string, endTime: string, targetUserId?: number) => Promise<void>;
  openModalScheduleId: number | null;
  setOpenModalScheduleId: (id: number | null) => void;
  openAddModalKey: string | null;
  setOpenAddModalKey: (key: string | null) => void;
}

export const WorkSchedule: React.FC<WorkScheduleProps> = ({
  currentLabel,
  onPrev,
  onNext,
  mode,
  onChangeMode,
  days,
  user,
  currentUserId,
  currentRoleId,
  onConfirmSchedule,
  onDeleteSchedule,
  onCreateSchedule,
  openModalScheduleId,
  setOpenModalScheduleId,
  openAddModalKey,
  setOpenAddModalKey,
}) => {
  const navigate = useNavigate();
  return (
    <section className="wrapper">
      <div className="header">
        <div className="go-to-schedule" onClick={() => navigate("/schedule")}>
          <p>График работы</p> <Icons.ArrowIcon />
        </div>
        <div className="currentPeriod">
          <div className="calendar">
            <Icons.CalendarIcon title="календарь"/>
            <span>{currentLabel}</span>
          </div>
          <div className="arrows">
            <button onClick={onPrev} className="arrowBtn">‹</button>
            <button onClick={onNext} className="arrowBtn">›</button>
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

      <div className={`scheduleGrid ${mode === "month" ? "month-view" : ""}`}>
        {days.map((day, index) => (
          <DayCell
            key={index}
            day={day}
            schedule={day.schedule}
            user={user}
            currentUserId={currentUserId}
            currentRoleId={currentRoleId}
            onConfirmSchedule={onConfirmSchedule}
            onDeleteSchedule={onDeleteSchedule}
            onCreateSchedule={onCreateSchedule}
            openModalScheduleId={openModalScheduleId}
            setOpenModalScheduleId={setOpenModalScheduleId}
            openAddModalKey={openAddModalKey}
            setOpenAddModalKey={setOpenAddModalKey}
            mode={mode}
          />
        ))}
      </div>
    </section>
  );
};

export default WorkSchedule;