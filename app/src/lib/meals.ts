import { sumNutrients } from '@/lib/nutrition';
import type { Meal, Nutrients } from '@/types/models';

export const MEALS: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Type guard for a route param such as `?meal=lunch`. */
export const isMeal = (value: unknown): value is Meal => MEALS.includes(value as Meal);

/** Sums nutrients per meal; meals without entries are zero. */
export function totalsByMeal(
  entries: { meal: Meal; nutrients: Nutrients }[],
): Record<Meal, Nutrients> {
  const result = {} as Record<Meal, Nutrients>;
  for (const meal of MEALS) {
    result[meal] = sumNutrients(entries.filter((e) => e.meal === meal).map((e) => e.nutrients));
  }
  return result;
}

/** Default meal for "Adaugă aliment" by local time: <11 breakfast, <16 lunch, <21 dinner, else snack. */
export function defaultMealFor(date: Date): Meal {
  const hour = date.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

/** Distinct food names of one meal in logged order, joined for a one-line subtitle. */
export function mealFoodNames(entries: { meal: Meal; food: { name: string } }[], meal: Meal): string {
  const names = entries.filter((e) => e.meal === meal).map((e) => e.food.name);
  return [...new Set(names)].join(', ');
}
