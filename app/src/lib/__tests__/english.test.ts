import type { LogEntryWithFood } from '@/db/types';
import { setLanguage, strings } from '@/i18n';
import { buildLogCsv } from '@/lib/csv';
import { formatDateLong, formatDayMonth, monthShort, weekdayAbbr, weekdayShort } from '@/lib/date';
import { formatDecimal, formatNumber, parseDecimal } from '@/lib/format';
import { portionLabel } from '@/lib/portion';
import { buildBars } from '@/lib/progress';
import { pluralEn, remainingScansText, scanLimitText } from '@/lib/scanLimit';

beforeEach(() => setLanguage('en'));
afterEach(() => setLanguage('ro'));

describe('English number format', () => {
  it('groups thousands with a comma and uses a decimal point', () => {
    expect(formatNumber(2000)).toBe('2,000');
    expect(formatNumber(-1250)).toBe('-1,250');
    expect(formatNumber(842)).toBe('842');
    expect(formatDecimal(72.4)).toBe('72.4');
    expect(formatDecimal(1234.5)).toBe('1,234.5');
    expect(formatDecimal(3, 1, true)).toBe('3');
  });

  it('still parses both notations', () => {
    expect(parseDecimal('72.4')).toBe(72.4);
    expect(parseDecimal('72,4')).toBe(72.4);
  });

  it('switches back to Romanian format', () => {
    setLanguage('ro');
    expect(formatNumber(2000)).toBe('2.000');
    expect(formatDecimal(1234.5)).toBe('1.234,5');
  });
});

describe('English dates', () => {
  it('formats the long date and day-month', () => {
    expect(formatDateLong(new Date(2026, 10, 18))).toBe('Wednesday, 18 November');
    expect(formatDateLong(new Date(2026, 0, 3))).toBe('Saturday, 3 January');
    expect(formatDayMonth(new Date(2026, 11, 1))).toBe('1 December');
  });

  it('uses English weekday and month labels for charts', () => {
    const monday = new Date(2026, 10, 16);
    const labels = Array.from({ length: 7 }, (_, i) =>
      weekdayAbbr(new Date(2026, 10, 16 + i)),
    );
    expect(labels).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    expect(weekdayShort(monday)).toBe('M');
    expect(monthShort(0)).toBe('Jan');
    expect(buildBars('year', [], monday).map((b) => b.label).slice(0, 3)).toEqual(['Jan', 'Feb', 'Mar']);
    expect(buildBars('week', [], monday)[0].label).toBe('Mo');
  });
});

describe('English plurals', () => {
  it('uses one for exactly 1 and other for everything else', () => {
    const forms = { one: 'scan', other: 'scans' };
    expect(pluralEn(1, forms)).toBe('scan');
    expect(pluralEn(0, forms)).toBe('scans');
    expect(pluralEn(2, forms)).toBe('scans');
    expect(pluralEn(20, forms)).toBe('scans');
    expect(pluralEn(101, forms)).toBe('scans');
  });

  it('writes the remaining scans and the limit message', () => {
    expect(remainingScansText(1)).toBe('1 scan left this month');
    expect(remainingScansText(7)).toBe('7 scans left this month');
    expect(remainingScansText(0)).toBe('0 scans left this month');
    expect(remainingScansText(20)).toBe('20 scans left this month');
    expect(scanLimitText(10, new Date(2026, 10, 19))).toBe(
      'You’ve used all 10 scans for this month. You can search manually any time; scans come back on 1 December.',
    );
  });

  it('translates stored serving names with singular and plural', () => {
    expect(portionLabel({ mode: 'servings', amount: 1 }, 'bol')).toBe('1 bowl');
    expect(portionLabel({ mode: 'servings', amount: 1.5 }, 'bol')).toBe('1.5 bowls');
    expect(portionLabel({ mode: 'servings', amount: 2 }, 'felie')).toBe('2 slices');
    expect(portionLabel({ mode: 'servings', amount: 2 })).toBe('2 servings');
    expect(portionLabel({ mode: 'grams', amount: 250 })).toBe('250 g');
  });
});

describe('English CSV', () => {
  const entry: LogEntryWithFood = {
    id: 'e1',
    date: '2026-11-18',
    meal: 'breakfast',
    foodId: 'f1',
    grams: 1200,
    createdAt: '2026-11-18T08:00:00.000Z',
    food: {
      id: 'f1',
      name: 'Bread, sliced',
      per100g: { kcal: 97, protein: 9, carbs: 3.5, fat: 5 },
      source: 'common',
    },
    nutrients: { kcal: 3120, protein: 13.5, carbs: 5.25, fat: 7.5 },
  };

  it('uses English labels, commas and decimal points', () => {
    const csv = buildLogCsv([entry], { header: strings.csv.header, meals: strings.meals }, 'en');
    expect(csv).toBe(
      'Date,Meal,Food,Brand,Grams,kcal,Protein (g),Carbohydrates (g),Fat (g)\r\n' +
        '2026-11-18,Breakfast,"Bread, sliced",,1200,3120,13.5,5.3,7.5\r\n',
    );
  });
});
