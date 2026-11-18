const WEEKDAYS = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
const WEEKDAYS_SHORT = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'];
const WEEKDAYS_ABBR = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'];
const MONTHS = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
];

/** "Miercuri, 18 noiembrie" */
export function formatDateLong(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "18 noiembrie" */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** One- or two-letter weekday label for charts ("L", "Ma", "Mi", …). */
export function weekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()];
}

/** Two-letter weekday label as in the Progress chart ("Lu", "Ma", …, "Du"). */
export function weekdayAbbr(date: Date): string {
  return WEEKDAYS_ABBR[date.getDay()];
}

/** Monday of the week containing `date` (local, midnight). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

export function monthName(monthIndex: number): string {
  return MONTHS[monthIndex];
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
