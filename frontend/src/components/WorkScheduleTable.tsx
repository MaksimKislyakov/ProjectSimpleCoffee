// src/components/WorkScheduleTable.tsx
import React, { useRef, useState, useEffect, useMemo } from "react"
import { EmployeeScheduleRow } from "./EmployeeScheduleRow.tsx"
import { DayData } from "./useScheduleUtils"

interface Props {
  users: any[]
  schedule: any[]
  days: DayData[]
  mode: "week" | "month"
  currentUserId: number | null
  currentRoleId: number
  onConfirmSchedule: (scheduleId: number, startTime?: string, endTime?: string) => Promise<void>
  onDeleteSchedule?: (scheduleId: number) => Promise<void>
  onCreateSchedule?: (date: Date, startTime: string, endTime: string, targetUserId?: number) => Promise<void>
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  selectedUserId?: number | null
  setSelectedUserId?: (id: number | null) => void
  showTodayOnly?: boolean
  setShowTodayOnly?: (show: boolean) => void
}

const WorkScheduleTable: React.FC<Props> = ({ 
  users, 
  schedule, 
  days, 
  mode, 
  currentUserId, 
  currentRoleId, 
  onConfirmSchedule,
  onDeleteSchedule,
  onCreateSchedule,
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  selectedUserId: externalSelectedUserId,
  setSelectedUserId: externalSetSelectedUserId,
  showTodayOnly: externalShowTodayOnly,
  setShowTodayOnly: externalSetShowTodayOnly
}) => {
  const rightRef = useRef<HTMLDivElement | null>(null)
  const [internalSearchQuery, setInternalSearchQuery] = useState("")
  const [internalSelectedUserId, setInternalSelectedUserId] = useState<number | null>(null)
  const [internalShowTodayOnly, setInternalShowTodayOnly] = useState(false)
  const [openModalScheduleId, setOpenModalScheduleId] = useState<number | null>(null)
  const [openAddModalKey, setOpenAddModalKey] = useState<string | null>(null) // Формат: "userId-dateISO"
  
  // Используем внешние или внутренние состояния
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
  const setSearchQuery = externalSetSearchQuery || setInternalSearchQuery
  const selectedUserId = externalSelectedUserId !== undefined ? externalSelectedUserId : internalSelectedUserId
  const setSelectedUserId = externalSetSelectedUserId || setInternalSelectedUserId
  const showTodayOnly = externalShowTodayOnly !== undefined ? externalShowTodayOnly : internalShowTodayOnly
  const setShowTodayOnly = externalSetShowTodayOnly || setInternalShowTodayOnly
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // единый шаблон колонок для заголовка и для строк
  const gridTemplate = `repeat(${Math.max(1, days.length)}, 1fr)`

  // Поиск сотрудников по частичному совпадению
  const filteredUsersBySearch = useMemo(() => {
    if (!searchQuery.trim()) return users
    
    const query = searchQuery.toLowerCase().trim()
    return users.filter(user => {
      const fullName = `${user.last_name} ${user.first_name} ${user.patronymic || ""}`.toLowerCase()
      const email = (user.email || "").toLowerCase()
      const telephone = (user.telephone || "").toLowerCase()
      
      return fullName.includes(query) || 
             email.includes(query) || 
             telephone.includes(query) ||
             user.last_name?.toLowerCase().includes(query) ||
             user.first_name?.toLowerCase().includes(query) ||
             (user.patronymic && user.patronymic.toLowerCase().includes(query))
    })
  }, [users, searchQuery])

  // Фильтр по выбранному сотруднику
  const filteredUsersBySelection = useMemo(() => {
    if (selectedUserId === null) return filteredUsersBySearch
    return filteredUsersBySearch.filter(user => user.id === selectedUserId)
  }, [filteredUsersBySearch, selectedUserId])

  // Фильтр "Сегодня" - показываем только сотрудников с сменами на сегодня
  const filteredUsers = useMemo(() => {
    if (!showTodayOnly) return filteredUsersBySelection
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return filteredUsersBySelection.filter(user => {
      const userSchedules = schedule.filter(s => s.user_id === user.id)
      return userSchedules.some(s => {
        if (!s.schedule_start_time) return false
        const scheduleDate = new Date(s.schedule_start_time)
        scheduleDate.setHours(0, 0, 0, 0)
        return scheduleDate.getTime() === today.getTime()
      })
    })
  }, [filteredUsersBySelection, showTodayOnly, schedule])

  // Закрытие выпадающего списка при клике вне области
  const searchRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])


  return (
    <div className={`schedule-wrapper ${mode === "week" ? "week-mode" : "month-mode"}`}>

      {/* ЛЕВАЯ ФИКСИРОВАННАЯ КОЛОНКА */}
      <div className="left-column">
        <div className="left-header">
          <div className="search-container" ref={searchRef}>
            <p>Сотрудники</p>
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedUserId(null)
                  setIsSearchFocused(true)
                }}
                onFocus={() => setIsSearchFocused(true)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => {
                  setSearchQuery("")
                  setSelectedUserId(null)
                  setIsSearchFocused(false)
                }} title="Очистить">
                  ×
                </button>
              )}
              {isSearchFocused && searchQuery && filteredUsersBySearch.length > 0 && (
                <div className="search-dropdown">
                  {filteredUsersBySearch.map(user => (
                    <div
                      key={user.id}
                      className="search-dropdown-item"
                      onClick={() => {
                        setSelectedUserId(user.id)
                        setSearchQuery(`${user.last_name} ${user.first_name} ${user.patronymic || ""}`.trim())
                        setIsSearchFocused(false)
                      }}
                    >
                      {user.last_name} {user.first_name} {user.patronymic || ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="today-filter-container">
            <p>Сегодня</p>
            <button
              className={`today-toggle ${showTodayOnly ? "active" : ""}`}
              onClick={() => setShowTodayOnly(!showTodayOnly)}
              title={showTodayOnly ? "Показать все дни" : "Показать только сегодня"}
            >
              <span className="today-toggle-slider"></span>
            </button>
          </div>
        </div>

        {filteredUsers.map(u => {
          // Определяем название роли на основе role_id
          const getRoleName = (roleId: number | undefined) => {
            if (roleId === 1) return "Администратор";
            if (roleId === 2) return "Менеджер";
            return "Бариста";
          };
          
          return (
            <div key={u.id} className="left-employee">
              <div className="name">{u.last_name} {u.first_name?.[0] || ""}. {u.patronymic?.[0] || ""}.</div>
              <div className="role">{getRoleName(u.role_id)}</div>
            </div>
          );
        })}

      </div>

      {/* ПРАВАЯ СКРОЛЛИРУЕМАЯ ЧАСТЬ */}
      <div className="right-area" ref={rightRef}>

        {/* Заголовок дней — grid */}
        <div
          className={`days-header${mode === "week" ? " week-mode" : ""}`}
          style={{
            display: "grid",
            gridTemplateColumns: mode === "week" ? `repeat(${Math.min(7, days.length)}, minmax(clamp(130px, 10vw, 160px), 1fr))` : gridTemplate,
            gap: mode === "week" ? "clamp(5px, 1vw, 7px)" : "8px",
            alignItems: "stretch",
            padding: "0 0 0 0",
            marginBottom: "8px"
          }}
        >
          {days.map((d, i) => {
            // Проверяем, является ли день сегодняшним
            const today = new Date();
            const dayDate = d.fullDate;
            const isToday = 
              dayDate.getFullYear() === today.getFullYear() &&
              dayDate.getMonth() === today.getMonth() &&
              dayDate.getDate() === today.getDate();
            
            return (
              <div className={`day-col ${isToday ? "day-col-today" : ""}`} key={i}>
                <div className="dow">{d.weekday}</div>
                <div className="day-num">{d.dayNumber}</div>
              </div>
            );
          })}
        </div>

        {/* Строки сотрудников */}
        <div className="rows">
          {filteredUsers.map(user => {
            const userSchedule = schedule.filter(s => s.user_id === user.id)
            return (
              <EmployeeScheduleRow
                key={user.id}
                user={user}
                userSchedule={userSchedule}
                days={days}
                mode={mode}
                currentUserId={currentUserId}
                currentRoleId={currentRoleId}
                onConfirmSchedule={onConfirmSchedule}
                onDeleteSchedule={onDeleteSchedule}
                onCreateSchedule={onCreateSchedule}
                openModalScheduleId={openModalScheduleId}
                setOpenModalScheduleId={setOpenModalScheduleId}
                openAddModalKey={openAddModalKey}
                setOpenAddModalKey={setOpenAddModalKey}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default WorkScheduleTable;
