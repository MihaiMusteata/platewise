import type { Activity, Goal, Nutrients, Sex } from '@/types/models';

export const TARGET_MIN = 1200;
export const TARGET_MAX = 4000;
export const TARGET_STEP = 50;

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  intense: 1.725,
};

export const GOAL_FACTOR: Record<Goal, number> = {
  lose: 0.85,
  maintain: 1,
  gain: 1.1,
};

/** Default macro split of the daily target and kcal per gram. */
export const MACRO_SPLIT = { protein: 0.3, carbs: 0.45, fat: 0.25 } as const;
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export interface TargetInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

/** Mifflin–St Jeor basal metabolic rate in kcal/day. */
export function bmr({ sex, age, heightCm, weightKg }: TargetInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function clampTarget(kcal: number): number {
  return Math.min(TARGET_MAX, Math.max(TARGET_MIN, kcal));
}

/** Daily target: BMR × activity × goal, rounded to 50 kcal, within 1.200–4.000. */
export function calcTarget(input: TargetInput): number {
  const raw = bmr(input) * ACTIVITY_FACTOR[input.activity] * GOAL_FACTOR[input.goal];
  return clampTarget(Math.round(raw / TARGET_STEP) * TARGET_STEP);
}

/** Applies a ± stepper change of 50 kcal, staying within 1.200–4.000. */
export function stepTarget(current: number, direction: 1 | -1): number {
  return clampTarget(current + direction * TARGET_STEP);
}

export interface MacroGoals {
  protein: number;
  carbs: number;
  fat: number;
}

/** Macro goals in whole grams from the default 30/45/25 split. */
export function macroGoals(targetKcal: number): MacroGoals {
  return {
    protein: Math.round((targetKcal * MACRO_SPLIT.protein) / KCAL_PER_GRAM.protein),
    carbs: Math.round((targetKcal * MACRO_SPLIT.carbs) / KCAL_PER_GRAM.carbs),
    fat: Math.round((targetKcal * MACRO_SPLIT.fat) / KCAL_PER_GRAM.fat),
  };
}

/** Remaining = target − food + exercise (may be negative when over goal). */
export function remaining(targetKcal: number, foodKcal: number, exerciseKcal = 0): number {
  return targetKcal - foodKcal + exerciseKcal;
}

/** Progress of food against target in 0..1, capped at 1 for display. */
export function progress(targetKcal: number, foodKcal: number): number {
  if (targetKcal <= 0) return 0;
  return Math.min(1, Math.max(0, foodKcal / targetKcal));
}

/** Nutrients for a portion: per-100 g values × grams. */
export function nutrientsFor(per100g: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  return {
    kcal: per100g.kcal * f,
    protein: per100g.protein * f,
    carbs: per100g.carbs * f,
    fat: per100g.fat * f,
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  return items.reduce(
    (acc, n) => ({
      kcal: acc.kcal + n.kcal,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
