import { totalsByMeal } from '@/lib/meals';
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
