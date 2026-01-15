// src/components/useScheduleUtils.ts

export interface ScheduleItem {
  id: number;
  user_id: number;
  coffee_shop_id: number;
  status: string;
  schedule_start_time: string;
  schedule_end_time: string;
  is_confirmed: boolean;
}

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

// --- Генерация недели (начинается со среды) ---
export const generateWeekDays = (startDate: Date = new Date()): DayData[] => {
  const days: DayData[] = [];
  const start = new Date(startDate);
  
  // Вычисляем смещение до ближайшей прошедшей среды (среда = 3)
  // Неделя: Ср, Чт, Пт, Сб, Вс, Пн, Вт
  const dayOfWeek = start.getDay();
  let offsetToWednesday: number;
  
  if (dayOfWeek === 0) { // Воскресенье - идем к среде 4 дня назад
    offsetToWednesday = -4;
  } else if (dayOfWeek === 1) { // Понедельник - идем к среде 5 дней назад (прошлая неделя)
    offsetToWednesday = -5;
  } else if (dayOfWeek === 2) { // Вторник - идем к среде 6 дней назад (прошлая неделя)
    offsetToWednesday = -6;
  } else if (dayOfWeek === 3) { // Среда - начало недели
    offsetToWednesday = 0;
  } else if (dayOfWeek === 4) { // Четверг - идем к среде 1 день назад
    offsetToWednesday = -1;
  } else if (dayOfWeek === 5) { // Пятница - идем к среде 2 дня назад
    offsetToWednesday = -2;
  } else { // Суббота (6) - идем к среде 3 дня назад
    offsetToWednesday = -3;
  }
  
  start.setDate(start.getDate() + offsetToWednesday);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    days.push({
      weekday: WEEKDAYS[d.getDay()],
      dayNumber: d.getDate(),
      date: `${WEEKDAYS[d.getDay()]} ${d.getDate()}`,
      fullDate: d,
      isEmpty: true,
      schedule: null // 🔴 явно указываем
    });
  }

  return days;
};

// --- Генерация месяца (с 1 числа по последний день месяца) ---
export const generateMonthDays = (date: Date = new Date()): DayData[] => {
  const days: DayData[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Генерируем дни месяца с 1 числа по последний день
  const cur = new Date(firstDay);
  
  while (cur <= lastDay) {
    days.push({
      weekday: WEEKDAYS[cur.getDay()],
      dayNumber: cur.getDate(),
      date: `${WEEKDAYS[cur.getDay()]} ${cur.getDate()}`,
      fullDate: new Date(cur),
      isEmpty: false,
      schedule: null // 🔴 явно указываем
    });
    cur.setDate(cur.getDate() + 1);
  }

  return days;
};

// --- Генерация 2 недель (для мобильной версии, начинается со среды) ---
export const generateTwoWeeks = (startDate: Date = new Date()): DayData[] => {
  const days: DayData[] = [];
  const start = new Date(startDate);
  
  // Вычисляем смещение до ближайшей прошедшей среды (среда = 3)
  // Неделя: Ср, Чт, Пт, Сб, Вс, Пн, Вт
  const dayOfWeek = start.getDay();
  let offsetToWednesday: number;
  
  if (dayOfWeek === 0) { // Воскресенье - идем к среде 4 дня назад
    offsetToWednesday = -4;
  } else if (dayOfWeek === 1) { // Понедельник - идем к среде 5 дней назад (прошлая неделя)
    offsetToWednesday = -5;
  } else if (dayOfWeek === 2) { // Вторник - идем к среде 6 дней назад (прошлая неделя)
    offsetToWednesday = -6;
  } else if (dayOfWeek === 3) { // Среда - начало недели
    offsetToWednesday = 0;
  } else if (dayOfWeek === 4) { // Четверг - идем к среде 1 день назад
    offsetToWednesday = -1;
  } else if (dayOfWeek === 5) { // Пятница - идем к среде 2 дня назад
    offsetToWednesday = -2;
  } else { // Суббота (6) - идем к среде 3 дня назад
    offsetToWednesday = -3;
  }
  
  start.setDate(start.getDate() + offsetToWednesday);

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
  
  // Вычисляем смещение до ближайшей прошедшей среды (среда = 3)
  // Неделя: Ср, Чт, Пт, Сб, Вс, Пн, Вт
  const dayOfWeek = date.getDay();
  let offsetToWednesday: number;
  
  if (dayOfWeek === 0) { // Воскресенье - идем к среде 4 дня назад
    offsetToWednesday = -4;
  } else if (dayOfWeek === 1) { // Понедельник - идем к среде 5 дней назад (прошлая неделя)
    offsetToWednesday = -5;
  } else if (dayOfWeek === 2) { // Вторник - идем к среде 6 дней назад (прошлая неделя)
    offsetToWednesday = -6;
  } else if (dayOfWeek === 3) { // Среда - начало недели
    offsetToWednesday = 0;
  } else if (dayOfWeek === 4) { // Четверг - идем к среде 1 день назад
    offsetToWednesday = -1;
  } else if (dayOfWeek === 5) { // Пятница - идем к среде 2 дня назад
    offsetToWednesday = -2;
  } else { // Суббота (6) - идем к среде 3 дня назад
    offsetToWednesday = -3;
  }
  
  start.setDate(date.getDate() + offsetToWednesday);

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

  // Делаем первую букву заглавной и добавляем год
  const year = startMonth === endMonth && startYear === endYear ? startYear : endYear;
  return monthName.charAt(0).toUpperCase() + monthName.slice(1) + " " + year;
};

// --- Заголовок недели (начинается со среды) ---
export const getWeekLabel = (date: Date): string => {
  const start = new Date(date);
  
  // Вычисляем смещение до ближайшей среды (среда = 3)
  const dayOfWeek = date.getDay();
  let offsetToWednesday: number;
  
  if (dayOfWeek === 0) { // Воскресенье
    offsetToWednesday = -4;
  } else if (dayOfWeek === 1) { // Понедельник
    offsetToWednesday = -6;
  } else if (dayOfWeek === 2) { // Вторник
    offsetToWednesday = -7;
  } else if (dayOfWeek === 3) { // Среда
    offsetToWednesday = 0;
  } else if (dayOfWeek === 4) { // Четверг
    offsetToWednesday = -1;
  } else if (dayOfWeek === 5) { // Пятница
    offsetToWednesday = -2;
  } else { // Суббота (6)
    offsetToWednesday = -3;
  }
  
  start.setDate(date.getDate() + offsetToWednesday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = start.toLocaleDateString("ru-RU", { month: "long" });

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${month}`;
  } else {
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