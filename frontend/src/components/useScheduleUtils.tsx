// src/components/useScheduleUtils.ts

export interface DayData {
  date: string;
  time?: string;
  isWorkDay?: boolean;
  isEmpty: boolean;
  fullDate: Date;
  weekday: string; 
  dayNumber: number;
  status?: string;
  comment?: string;
}

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

// --- Генерация недели ---
export const generateWeekDays = (startDate: Date = new Date()): DayData[] => {
  const days: DayData[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));


  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    days.push({
      weekday: WEEKDAYS[d.getDay()],
      dayNumber: d.getDate(),
      date: `${WEEKDAYS[d.getDay()]} ${d.getDate()}`,
      fullDate: d,
      isEmpty: true
    });
  }

  return days;
};

// --- Генерация месяца ---
export const generateMonthDays = (date: Date = new Date()): DayData[] => {
  const days: DayData[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();

  const cur = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  while (cur <= last) {
    days.push({
      weekday: WEEKDAYS[cur.getDay()],
      dayNumber: cur.getDate(),
      date: `${WEEKDAYS[cur.getDay()]} ${cur.getDate()}`,
      fullDate: new Date(cur),
      isEmpty: false
    });
    cur.setDate(cur.getDate() + 1);
  }

  return days;
};

// --- Заголовок недели ---
export const getWeekLabel = (date: Date): string => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay() + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  return `${fmt(start)} – ${fmt(end)}`;
};

// --- Заголовок месяца ---
export const getMonthLabel = (date: Date): string => {
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
};
