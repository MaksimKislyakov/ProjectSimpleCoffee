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
  isConfirmed?: boolean;
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

// --- Генерация 2 недель (для мобильной версии) ---
export const generateTwoWeeks = (startDate: Date = new Date()): DayData[] => {
  const days: DayData[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));

  for (let i = 0; i < 14; i++) {
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

// --- Заголовок для 2 недель (только название месяца для мобильной версии) ---
export const getTwoWeeksLabel = (date: Date): string => {
  const start = new Date(date);
  start.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));

  const end = new Date(start);
  end.setDate(start.getDate() + 13);

  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  let monthName: string;

  // Если начало и конец в одном месяце
  if (startMonth === endMonth && startYear === endYear) {
    monthName = start.toLocaleDateString("ru-RU", { month: "long" });
  } else {
    // Если есть прошлый и будущий месяц, выбираем будущий
    // Иначе выбираем месяц, который идет следующим (будущий)
    const futureMonth = endMonth;
    const futureYear = endYear;
    const futureDate = new Date(futureYear, futureMonth, 1);
    monthName = futureDate.toLocaleDateString("ru-RU", { month: "long" });
  }

  // Делаем первую букву заглавной
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
};

// --- Заголовок недели ---
export const getWeekLabel = (date: Date): string => {
  const start = new Date(date);
  start.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = start.toLocaleDateString("ru-RU", { month: "long" });

  // Если начало и конец в одном месяце
  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${month}`;
  } else {
    // Если неделя переходит через месяц
    const startMonth = start.toLocaleDateString("ru-RU", { month: "long" });
    const endMonth = end.toLocaleDateString("ru-RU", { month: "long" });
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
};

// --- Заголовок месяца ---
export const getMonthLabel = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDay = firstDay.getDate();
  const endDay = lastDay.getDate();
  const monthName = date.toLocaleDateString("ru-RU", { month: "long" });
  
  return `${startDay} - ${endDay} ${monthName}`;
};
