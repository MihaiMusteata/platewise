/** @jest-environment node */
import { getFood, recentFoods, upsertFood } from '../foodsRepo';
import {
  addEntry,
  dailyTotals,
  deleteAllData,
  deleteEntry,
  entriesForDate,
  restoreEntry,
} from '../logRepo';
import { migrate } from '../schema';
import { COMMON_FOODS, seedCommonFoods } from '../seed';

import { createTestDb, type TestDb } from '../testing/testDb';

let mockUuid = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `uuid-${++mockUuid}`,
}));

let db: TestDb;

beforeEach(async () => {
  mockUuid = 0;
  db = createTestDb();
  await migrate(db);
  await seedCommonFoods(db);
});

afterEach(() => db.close());

describe('log entries', () => {
  it('adds an entry and marks the food as used', async () => {
    const entry = await addEntry(
      db,
      {
        date: '2026-11-18',
        meal: 'breakfast',
        foodId: 'common:ou-fiert',
        grams: 100,
      },
      '2026-11-18T07:30:00.000Z',
    );
    expect(entry).toEqual({
      id: 'uuid-1',
      date: '2026-11-18',
      meal: 'breakfast',
      foodId: 'common:ou-fiert',
      grams: 100,
      createdAt: '2026-11-18T07:30:00.000Z',
    });
    expect((await recentFoods(db)).map((f) => f.id)).toEqual(['common:ou-fiert']);
  });

  it('returns entries with food and nutrients for a date', async () => {
    await addEntry(
      db,
      {
        date: '2026-11-18',
        meal: 'breakfast',
        foodId: 'common:ou-fiert',
        grams: 100,
      },
      '2026-11-18T07:00:00.000Z',
    );
    await addEntry(
      db,
      {
        date: '2026-11-18',
        meal: 'lunch',
        foodId: 'common:orez-fiert',
        grams: 150,
      },
      '2026-11-18T12:00:00.000Z',
    );
    await addEntry(
      db,
      { date: '2026-11-17', meal: 'dinner', foodId: 'common:mar', grams: 180 },
      '2026-11-17T19:00:00.000Z',
    );

    const entries = await entriesForDate(db, '2026-11-18');
    expect(entries.map((e) => e.foodId)).toEqual(['common:ou-fiert', 'common:orez-fiert']);
    const [egg, rice] = entries;
    expect(egg.food).toEqual(COMMON_FOODS.find((f) => f.id === 'common:ou-fiert'));
    expect(egg.nutrients).toEqual({
      kcal: 155,
      protein: 12.6,
      carbs: 1.1,
      fat: 10.6,
    });
    expect(rice.meal).toBe('lunch');
    expect(rice.nutrients.kcal).toBeCloseTo(195);
    expect(rice.nutrients.carbs).toBeCloseTo(42);
    expect(await entriesForDate(db, '2026-11-16')).toEqual([]);
  });

  it('deletes and restores an entry with the same id', async () => {
    const entry = await addEntry(db, {
      date: '2026-11-18',
      meal: 'snack',
      foodId: 'common:banana',
      grams: 120,
    });
    await deleteEntry(db, entry.id);
    expect(await entriesForDate(db, '2026-11-18')).toEqual([]);
    await restoreEntry(db, entry);
    const [restored] = await entriesForDate(db, '2026-11-18');
    expect(restored).toMatchObject(entry);
  });

  it('computes daily totals for days with entries in range', async () => {
    await addEntry(db, {
      date: '2026-11-15',
      meal: 'lunch',
      foodId: 'common:mar',
      grams: 100,
    });
    await addEntry(db, {
      date: '2026-11-16',
      meal: 'lunch',
      foodId: 'common:ou-fiert',
      grams: 50,
    });
    await addEntry(db, {
      date: '2026-11-16',
      meal: 'dinner',
      foodId: 'common:paste-fierte',
      grams: 200,
    });
    await addEntry(db, {
      date: '2026-11-18',
      meal: 'snack',
      foodId: 'common:nuci',
      grams: 30,
    });
    await addEntry(db, {
      date: '2026-11-20',
      meal: 'snack',
      foodId: 'common:mar',
      grams: 100,
    });

    const totals = await dailyTotals(db, '2026-11-16', '2026-11-18');
    expect(totals.map((t) => t.date)).toEqual(['2026-11-16', '2026-11-18']);
    expect(totals[0].kcal).toBeCloseTo(77.5 + 316);
    expect(totals[0].protein).toBeCloseTo(6.3 + 11.6);
    expect(totals[0].carbs).toBeCloseTo(0.55 + 62);
    expect(totals[0].fat).toBeCloseTo(5.3 + 1.8);
    expect(totals[1].kcal).toBeCloseTo(196.2);
  });

  it('deleteAllData wipes the log and user foods but keeps common foods', async () => {
    await upsertFood(db, {
      id: 'c1',
      name: 'Rețeta mea',
      per100g: { kcal: 100, protein: 5, carbs: 10, fat: 4 },
      source: 'custom',
    });
    await addEntry(db, {
      date: '2026-11-18',
      meal: 'lunch',
      foodId: 'c1',
      grams: 100,
    });
    await addEntry(db, {
      date: '2026-11-18',
      meal: 'lunch',
      foodId: 'common:mar',
      grams: 100,
    });

    await deleteAllData(db);

    expect(await entriesForDate(db, '2026-11-18')).toEqual([]);
    expect(await getFood(db, 'c1')).toBeNull();
    expect(await recentFoods(db)).toEqual([]);
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM foods', []);
    expect(row?.n).toBe(COMMON_FOODS.length);
  });
});
