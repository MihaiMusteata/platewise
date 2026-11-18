import type { LogEntryWithFood } from '@/db/types';
import { buildLogCsv } from '@/lib/csv';

const labels = {
  header: ['Data', 'Masă', 'Aliment', 'Marcă', 'Grame', 'kcal', 'Proteine', 'Carbohidrați', 'Grăsimi'],
  meals: { breakfast: 'Mic dejun', lunch: 'Prânz', dinner: 'Cină', snack: 'Gustare' },
} as const;

const entry = (over: Partial<LogEntryWithFood> = {}): LogEntryWithFood => ({
  id: 'e1',
  date: '2026-11-18',
  meal: 'breakfast',
  foodId: 'f1',
  grams: 150,
  createdAt: '2026-11-18T08:00:00.000Z',
  food: {
    id: 'f1',
    name: 'Iaurt grecesc',
    brand: 'Olympus',
    per100g: { kcal: 97, protein: 9, carbs: 3.5, fat: 5 },
    source: 'common',
  },
  nutrients: { kcal: 145.5, protein: 13.5, carbs: 5.25, fat: 7.5 },
  ...over,
});

describe('buildLogCsv', () => {
  it('writes a header and one row per entry with Romanian decimals', () => {
    expect(buildLogCsv([entry()], labels)).toBe(
      'Data;Masă;Aliment;Marcă;Grame;kcal;Proteine;Carbohidrați;Grăsimi\r\n' +
        '2026-11-18;Mic dejun;Iaurt grecesc;Olympus;150;146;13,5;5,3;7,5\r\n',
    );
  });

  it('quotes fields with separators or quotes and omits thousands dots', () => {
    const csv = buildLogCsv(
      [
        entry({
          grams: 1200,
          food: { ...entry().food, name: 'Pâine "de casă"; feliată', brand: undefined },
          nutrients: { kcal: 3120, protein: 1, carbs: 1, fat: 1 },
        }),
      ],
      labels,
    );
    expect(csv.split('\r\n')[1]).toBe(
      '2026-11-18;Mic dejun;"Pâine ""de casă""; feliată";;1200;3120;1,0;1,0;1,0',
    );
  });

  it('exports only the header for an empty log', () => {
    expect(buildLogCsv([], labels).split('\r\n')).toHaveLength(2);
  });
});
