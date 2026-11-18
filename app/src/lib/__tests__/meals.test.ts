import { defaultMealFor, mealFoodNames, totalsByMeal } from '@/lib/meals';
import { normalizeForSearch } from '@/lib/text';

describe('totalsByMeal', () => {
  it('sums per meal and zero-fills empty meals', () => {
    const n = (kcal: number) => ({ kcal, protein: 1, carbs: 2, fat: 3 });
    const totals = totalsByMeal([
      { meal: 'breakfast', nutrients: n(100) },
      { meal: 'breakfast', nutrients: n(50) },
      { meal: 'snack', nutrients: n(20) },
    ]);
    expect(totals.breakfast).toEqual({
      kcal: 150,
      protein: 2,
      carbs: 4,
      fat: 6,
    });
    expect(totals.snack.kcal).toBe(20);
    expect(totals.lunch).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
    expect(totals.dinner.kcal).toBe(0);
  });
});

describe('normalizeForSearch', () => {
  it('lowercases, strips Romanian diacritics (both comma and cedilla forms) and trims', () => {
    expect(normalizeForSearch('  Brânză  de VACI ')).toBe('branza de vaci');
    expect(normalizeForSearch('Șnițel ŞTIR ţuică Ăîâ')).toBe('snitel stir tuica aia');
  });
});

describe('defaultMealFor', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 10, 19, hour, minute);

  it('picks the meal by local time of day', () => {
    expect(defaultMealFor(at(0))).toBe('breakfast');
    expect(defaultMealFor(at(10, 59))).toBe('breakfast');
    expect(defaultMealFor(at(11))).toBe('lunch');
    expect(defaultMealFor(at(15, 59))).toBe('lunch');
    expect(defaultMealFor(at(16))).toBe('dinner');
    expect(defaultMealFor(at(20, 59))).toBe('dinner');
    expect(defaultMealFor(at(21))).toBe('snack');
    expect(defaultMealFor(at(23, 59))).toBe('snack');
  });
});

describe('mealFoodNames', () => {
  it('joins distinct names of one meal in order', () => {
    const e = (meal: 'breakfast' | 'lunch', name: string) => ({ meal, food: { name } });
    const entries = [e('breakfast', 'Ou fiert'), e('lunch', 'Orez'), e('breakfast', 'Măr'), e('breakfast', 'Ou fiert')];
    expect(mealFoodNames(entries, 'breakfast')).toBe('Ou fiert, Măr');
    expect(mealFoodNames(entries, 'lunch')).toBe('Orez');
    expect(mealFoodNames([], 'lunch')).toBe('');
  });
});
