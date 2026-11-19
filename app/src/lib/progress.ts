import { addDays, fromDateKey, monthShort, startOfWeek, toDateKey, weekdayAbbr } from '@/lib/date';
import { KCAL_PER_GRAM } from '@/lib/nutrition';
import type { Nutrients } from '@/types/models';

export type Period = 'week' | 'month' | 'year';

export interface DayTotals extends Nutrients {
  date: string; // YYYY-MM-DD
}

export interface Bar {
  key: string;
  label: string;
  /** kcal for the day, or average kcal per logged day for a month bar (year view). */
  kcal: number;
  isCurrent: boolean;
}

export interface Range {
  from: string;
  to: string;
}

/** Calendar range of the period containing `today`: Monday–Sunday, whole month, or whole year. */
export function periodRange(period: Period, today: Date): Range {
  if (period === 'week') {
    const monday = startOfWeek(today);
    return { from: toDateKey(monday), to: toDateKey(addDays(monday, 6)) };
  }
  if (period === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: toDateKey(first), to: toDateKey(last) };
  }
  return {
    from: toDateKey(new Date(today.getFullYear(), 0, 1)),
    to: toDateKey(new Date(today.getFullYear(), 11, 31)),
  };
}

/** Chart bars: one per day (week, month) or one per month (year, average of logged days). */
export function buildBars(period: Period, totals: DayTotals[], today: Date): Bar[] {
  const byDate = new Map(totals.map((t) => [t.date, t.kcal]));
  const todayKey = toDateKey(today);
  const { from, to } = periodRange(period, today);

  if (period !== 'year') {
    const bars: Bar[] = [];
    for (let d = fromDateKey(from); toDateKey(d) <= to; d = addDays(d, 1)) {
      const key = toDateKey(d);
      bars.push({
        key,
        label: period === 'week' ? weekdayAbbr(d) : String(d.getDate()),
        kcal: byDate.get(key) ?? 0,
        isCurrent: key === todayKey,
      });
    }
    return bars;
  }

  return Array.from({ length: 12 }, (_, month) => {
    const prefix = `${today.getFullYear()}-${String(month + 1).padStart(2, '0')}`;
    const days = totals.filter((t) => t.date.startsWith(prefix));
    const kcal = days.length ? days.reduce((sum, t) => sum + t.kcal, 0) / days.length : 0;
    return {
      key: prefix,
      label: monthShort(month),
      kcal,
      isCurrent: month === today.getMonth(),
    };
  });
}

/** Average kcal over days that have at least one entry (0 when none). */
export function averageKcal(totals: DayTotals[]): number {
  const logged = totals.filter((t) => t.kcal > 0);
  return logged.length ? logged.reduce((sum, t) => sum + t.kcal, 0) / logged.length : 0;
}

export interface WeeklyGoal {
  consumed: number;
  goal: number;
  /** 0..1, capped at 1 for display. */
  ratio: number;
}

/** Current week's intake against target × 7. */
export function weeklyGoal(weekTotals: DayTotals[], dailyTargetKcal: number): WeeklyGoal {
  const consumed = weekTotals.reduce((sum, t) => sum + t.kcal, 0);
  const goal = dailyTargetKcal * 7;
  return { consumed, goal, ratio: goal > 0 ? Math.min(1, consumed / goal) : 0 };
}

export interface MacroShare {
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Share of energy from each macro in whole percent, summing to 100
 * (largest-remainder rounding). All zero when nothing is logged.
 */
export function macroShare(totals: DayTotals[]): MacroShare {
  const kcal = {
    protein: totals.reduce((s, t) => s + t.protein, 0) * KCAL_PER_GRAM.protein,
    carbs: totals.reduce((s, t) => s + t.carbs, 0) * KCAL_PER_GRAM.carbs,
    fat: totals.reduce((s, t) => s + t.fat, 0) * KCAL_PER_GRAM.fat,
  };
  const sum = kcal.protein + kcal.carbs + kcal.fat;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };

  const keys = ['protein', 'carbs', 'fat'] as const;
  const exact = keys.map((k) => (kcal[k] / sum) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, rem: v - floors[i] }))
    .sort((a, b) => b.rem - a.rem);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return { protein: floors[0], carbs: floors[1], fat: floors[2] };
}

/** Nice axis maximum for the calorie chart (multiple of 1.000, at least the goal line). */
export function chartMax(bars: Bar[], goal: number): number {
  const peak = Math.max(goal, ...bars.map((b) => b.kcal));
  return Math.max(1000, Math.ceil(peak / 1000) * 1000);
}
