// src/components/EmployeeScheduleRow.tsx
import React from "react"
import { DayData } from "./useScheduleUtils.tsx"
import { DayCell } from "./DayCell.tsx"

interface EmployeeScheduleRowProps {
  user: any
  days: DayData[]
  userSchedule: any[]
  mode: "week" | "month"
  currentUserId: number | null
  currentRoleId: number
  onConfirmSchedule: (scheduleId: number, startTime?: string, endTime?: string) => Promise<void>
  onDeleteSchedule?: (scheduleId: number) => Promise<void>
  onCreateSchedule?: (date: Date, startTime: string, endTime: string, targetUserId?: number) => Promise<void>
  openModalScheduleId: number | null
  setOpenModalScheduleId: (id: number | null) => void
  openAddModalKey: string | null
  setOpenAddModalKey: (key: string | null) => void
}

export const EmployeeScheduleRow: React.FC<EmployeeScheduleRowProps> = ({
  user,
  days,
  userSchedule,
  mode,
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
  // gridTemplateColumns повторяет количество колонок (чтобы выровнять с заголовком)
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${days.length}, 1fr)`,
    gap: "8px",
    alignItems: "stretch"
  }

  return (
    <div className="employee-row">
      <div className={`days-row${mode === "week" ? " week-mode" : ""}`} style={gridStyle}>
        {days.map((day, index) => {
          // Сравниваем по компонентам даты — это устойчиво к таймзоне
          const match = userSchedule.find((s: any) => {
            if (!s || !s.schedule_start_time) return false
            const sd = new Date(s.schedule_start_time)
            return (
              sd.getFullYear() === day.fullDate.getFullYear() &&
              sd.getMonth() === day.fullDate.getMonth() &&
              sd.getDate() === day.fullDate.getDate()
            )
          })

          return <DayCell key={index} schedule={match || null} day={day} user={user} currentUserId={currentUserId} currentRoleId={currentRoleId} onConfirmSchedule={onConfirmSchedule} onDeleteSchedule={onDeleteSchedule} onCreateSchedule={onCreateSchedule} openModalScheduleId={openModalScheduleId} setOpenModalScheduleId={setOpenModalScheduleId} openAddModalKey={openAddModalKey} setOpenAddModalKey={setOpenAddModalKey} mode={mode} />
        })}
      </div>
    </div>
  )
}
