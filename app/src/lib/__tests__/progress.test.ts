import {
  averageKcal,
  buildBars,
  chartMax,
  macroShare,
  periodRange,
  weeklyGoal,
  type DayTotals,
} from '@/lib/progress';

// Wednesday 18 November 2026
const today = new Date(2026, 10, 18);
const day = (date: string, kcal: number, protein = 0, carbs = 0, fat = 0): DayTotals => ({
  date,
  kcal,
  protein,
  carbs,
  fat,
});

describe('periodRange', () => {
  it('weeks run Monday to Sunday', () => {
    expect(periodRange('week', today)).toEqual({ from: '2026-11-16', to: '2026-11-22' });
    // Sunday belongs to the week that started the previous Monday
    expect(periodRange('week', new Date(2026, 10, 22))).toEqual({
      from: '2026-11-16',
      to: '2026-11-22',
    });
  });
  it('covers the whole month and year', () => {
    expect(periodRange('month', today)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(periodRange('month', new Date(2028, 1, 10))).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    });
    expect(periodRange('year', today)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});

describe('buildBars', () => {
  it('gives 7 labelled days for a week, zero-filled', () => {
    const bars = buildBars('week', [day('2026-11-17', 1800)], today);
    expect(bars.map((b) => b.label)).toEqual(['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']);
    expect(bars.map((b) => b.kcal)).toEqual([0, 1800, 0, 0, 0, 0, 0]);
    expect(bars.find((b) => b.isCurrent)?.key).toBe('2026-11-18');
  });
  it('gives one bar per day of the month', () => {
    expect(buildBars('month', [], today)).toHaveLength(30);
  });
  it('averages logged days per month for a year', () => {
    const bars = buildBars(
      'year',
      [day('2026-11-01', 2000), day('2026-11-02', 1000), day('2026-03-05', 1500)],
      today,
    );
    expect(bars).toHaveLength(12);
    expect(bars[10]).toMatchObject({ kcal: 1500, label: 'noi', isCurrent: true });
    expect(bars[2].kcal).toBe(1500);
    expect(bars[0].kcal).toBe(0);
  });
});

describe('averageKcal', () => {
  it('averages only logged days', () => {
    expect(averageKcal([day('a', 2000), day('b', 0), day('c', 1000)])).toBe(1500);
    expect(averageKcal([])).toBe(0);
  });
});

describe('weeklyGoal', () => {
  it('compares the week with target × 7', () => {
    expect(weeklyGoal([day('a', 6000), day('b', 6201)], 2000)).toEqual({
      consumed: 12201,
      goal: 14000,
      ratio: 12201 / 14000,
    });
  });
  it('caps the ratio at 1', () => {
    expect(weeklyGoal([day('a', 20000)], 2000).ratio).toBe(1);
  });
});

describe('macroShare', () => {
  it('splits energy by macro and sums to 100', () => {
    // 100 g protein = 400, 200 g carbs = 800, 40 g fat = 360 → 1560 kcal
    const share = macroShare([day('a', 0, 100, 200, 40)]);
    expect(share).toEqual({ protein: 26, carbs: 51, fat: 23 });
    expect(share.protein + share.carbs + share.fat).toBe(100);
  });
  it('is all zero with no data', () => {
    expect(macroShare([])).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });
});

describe('chartMax', () => {
  it('rounds up to the next 1.000 and includes the goal', () => {
    expect(chartMax([{ key: 'a', label: 'Lu', kcal: 2400, isCurrent: false }], 2000)).toBe(3000);
    expect(chartMax([], 1850)).toBe(2000);
  });
});
