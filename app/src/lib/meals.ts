import { sumNutrients } from '@/lib/nutrition';
import type { Meal, Nutrients } from '@/types/models';

export const MEALS: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

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
