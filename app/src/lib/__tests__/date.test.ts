import {
  addDays,
  formatDateLong,
  formatDayMonth,
  fromDateKey,
  toDateKey,
  toMonthKey,
  weekdayShort,
} from '@/lib/date';

describe('Romanian dates', () => {
  it('formats a long date', () => {
    expect(formatDateLong(new Date(2026, 10, 18))).toBe('Miercuri, 18 noiembrie');
    expect(formatDateLong(new Date(2026, 10, 22))).toBe('Duminică, 22 noiembrie');
    expect(formatDateLong(new Date(2026, 0, 3))).toBe('Sâmbătă, 3 ianuarie');
  });
  it('formats day and month', () => {
    expect(formatDayMonth(new Date(2026, 2, 1))).toBe('1 martie');
  });
  it('gives short weekday labels', () => {
    expect(weekdayShort(new Date(2026, 10, 16))).toBe('L');
    expect(weekdayShort(new Date(2026, 10, 17))).toBe('Ma');
  });
});

describe('date keys', () => {
  it('round-trips local dates', () => {
    const d = new Date(2026, 1, 5, 23, 30);
    expect(toDateKey(d)).toBe('2026-02-05');
    expect(toDateKey(fromDateKey('2026-02-05'))).toBe('2026-02-05');
  });
  it('builds month keys', () => {
    expect(toMonthKey(new Date(2026, 11, 31))).toBe('2026-12');
  });
  it('adds days across months', () => {
    expect(toDateKey(addDays(new Date(2026, 10, 30), 1))).toBe('2026-12-01');
    expect(toDateKey(addDays(new Date(2026, 0, 1), -1))).toBe('2025-12-31');
  });
});
