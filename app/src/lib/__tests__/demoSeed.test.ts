import { COMMON_FOODS } from '@/db/seed';
import { demoEntries } from '@/lib/demoSeed';

describe('demoEntries', () => {
  const entries = demoEntries(new Date(2026, 10, 18));

  it('covers the 7 days ending today', () => {
    const dates = [...new Set(entries.map((e) => e.date))];
    expect(dates).toEqual([
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
    ]);
  });

  it('only references seeded common foods', () => {
    const ids = new Set(COMMON_FOODS.map((f) => f.id));
    for (const e of entries) expect(ids.has(e.foodId)).toBe(true);
  });

  it('logs every meal on every day', () => {
    for (const date of new Set(entries.map((e) => e.date))) {
      const meals = new Set(entries.filter((e) => e.date === date).map((e) => e.meal));
      expect(meals.size).toBe(4);
    }
  });
});
