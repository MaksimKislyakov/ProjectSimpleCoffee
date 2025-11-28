// src/components/useReportUtils.ts
import { DayData, getMonthLabel } from "./useScheduleUtils.tsx";

export interface ReportRow {
  user_id: number;
  name: string;
  roleName?: string;
  shifts: number;
  work_hours: number;
  total_earnings: number;
  total_fine: number;
  total_award: number;
  total: number;

  // строковые форматированные поля для отображения
  earningsFormatted?: string;
  finesFormatted?: string;
  bonusesFormatted?: string;
  totalFormatted?: string;
}

// helper: парсит строковую hourly_rate в число
const parseHourly = (hr: any) => {
  if (hr == null) return 0;
  const n = Number(hr);
  if (!isFinite(n)) {
    // если сервер хранит в странном формате — попытаемся вытащить цифры
    const digits = ("" + hr).replace(/[^0-9.]/g, "");
    const p = Number(digits);
    return isFinite(p) ? p : 0;
  }
  return n;
};

export const formatMoney = (v: number) =>
  v.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";

/**
 * computeReport(users, schedule, monthDate)
 * - users: массив пользователей (должен содержать id, first_name, last_name, patronymic, hourly_rate, role_id)
 * - schedule: массив всех смен (должен содержать user_id, schedule_start_time, schedule_end_time, optionally fine, bonus, status)
 * - monthDate: любая дата в месяце, за который создаём отчёт
 */
export const computeReport = (users: any[], schedule: any[], monthDate: Date): ReportRow[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const rows: ReportRow[] = users.map(u => ({
    user_id: u.id,
    name: `${u.last_name} ${u.first_name} ${u.patronymic ? u.patronymic[0] + "." : ""}`,
    roleName: (u.role_id === 1 && "Admin") || (u.role_id === 2 && "Manager") || "Бариста",
    shifts: 0,
    work_hours: 0,
    total_earnings: 0,
    total_fine: 0,
    total_award: 0,
    total: 0
  }));

  // индекс по user_id для ускорения
  const idx = new Map<number, ReportRow>();
  rows.forEach(r => idx.set(r.user_id, r));

  schedule.forEach((s: any) => {
    if (!s || !s.user_id || !s.schedule_start_time || !s.schedule_end_time) return;
    const sd = new Date(s.schedule_start_time);
    // проверяем, что попадает в целевой месяц
    if (sd.getFullYear() !== year || sd.getMonth() !== month) return;

    const userRow = idx.get(s.user_id);
    if (!userRow) return;

    // считаем длительность в часах
    const start = new Date(s.schedule_start_time);
    const end = new Date(s.schedule_end_time);
    const ms = Math.max(0, end.getTime() - start.getTime());
    const hours = ms / (1000 * 60 * 60);

    userRow.shifts += 1;
    userRow.work_hours += hours;

    // earning: hours * hourly_rate
    const hourly = parseHourly((users.find((x: any) => x.id === s.user_id) || {}).hourly_rate);
    const earning = hours * hourly;
    userRow.total_earnings += earning;

    // fines & bonuses — поменяй названия полей, если API даёт другие
    const fine = Number(s.fine || s.penalty || 0);
    const bonus = Number(s.bonus || s.premium || 0);

    userRow.total_fine += isFinite(fine) ? fine : 0;
    userRow.total_award += isFinite(bonus) ? bonus : 0;
  });

  // финальные поля и форматирование
  rows.forEach(r => {
    r.total = r.total_earnings + r.total_award - r.total_fine;
    r.earningsFormatted = formatMoney(r.total_earnings);
    r.finesFormatted = formatMoney(r.total_fine);
    r.bonusesFormatted = formatMoney(r.total_award);
    r.totalFormatted = formatMoney(r.total);
  });

  // сортируем по фамилии
  rows.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return rows;
};
