import { progress, remaining } from '@/lib/nutrition';

export type Greeting = 'morning' | 'day' | 'evening';

/** Time-of-day greeting: before 12 morning, before 18 day, else evening. */
export function greetingFor(date: Date): Greeting {
  const hour = date.getHours();
  if (hour < 5) return 'evening';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'day';
  return 'evening';
}

export interface DaySummary {
  /** Food kcal, rounded. */
  food: number;
  /** kcal left (≥ 0), or kcal above the target when `over`. */
  remaining: number;
  over: boolean;
  /** Progress 0..1, capped at 1. */
  progress: number;
  /** Whole percent 0..100, capped. */
  percent: number;
}

/** Hero numbers for Home. No exercise tracking in the demo, so exercise is 0. */
export function daySummary(targetKcal: number, foodKcal: number): DaySummary {
  const food = Math.round(foodKcal);
  const left = remaining(targetKcal, food, 0);
  const ratio = progress(targetKcal, food);
  return {
    food,
    remaining: Math.abs(left),
    over: left < 0,
    progress: ratio,
    percent: Math.round(ratio * 100),
  };
}
