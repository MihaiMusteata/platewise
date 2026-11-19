import { strings } from '@/i18n';

/** Weekday and month names come from the active dictionary (`strings.calendar`). */
const cal = () => strings.calendar;

/** "Miercuri, 18 noiembrie" (ro), "Wednesday, 18 November" (en). */
export function formatDateLong(date: Date): string {
  return `${cal().weekdays[date.getDay()]}, ${formatDayMonth(date)}`;
}

/** "18 noiembrie" (ro), "18 November" (en). */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${cal().months[date.getMonth()]}`;
}

/** One- or two-letter weekday label ("L", "Ma", "Mi", … / "M", "Tu", "W", …). */
export function weekdayShort(date: Date): string {
  return cal().weekdaysShort[date.getDay()];
}

/** Two-letter weekday label as in the Progress chart ("Lu", "Ma", …, "Du" / "Mo", "Tu", …, "Su"). */
export function weekdayAbbr(date: Date): string {
  return cal().weekdaysAbbr[date.getDay()];
}
/** Monday of the week containing `date` (local, midnight). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

export function monthName(monthIndex: number): string {
  return cal().months[monthIndex];
}

/** Short month label for the year chart ("ian", "feb" / "Jan", "Feb"). */
export function monthShort(monthIndex: number): string {
  return cal().monthsShort[monthIndex];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses YYYY-MM-DD as a local date (midnight). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Local calendar month as YYYY-MM. */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
