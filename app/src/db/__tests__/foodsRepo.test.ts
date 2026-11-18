/** @jest-environment node */
import {
  getFood,
  getFoodByBarcode,
  markFoodUsed,
  myFoods,
  recentFoods,
  searchFoods,
  upsertFood,
} from '../foodsRepo';
import { migrate, SCHEMA_VERSION } from '../schema';
import { COMMON_FOODS, seedCommonFoods } from '../seed';
import type { Food } from '@/types/models';

import { createTestDb, type TestDb } from '../testing/testDb';

const custom = (id: string, name: string, extra: Partial<Food> = {}): Food => ({
  id,
  name,
  per100g: { kcal: 100, protein: 10, carbs: 10, fat: 1 },
  source: 'custom',
  ...extra,
});

let db: TestDb;

beforeEach(async () => {
  db = createTestDb();
  await migrate(db);
});

afterEach(() => db.close());

describe('schema', () => {
  it('sets user_version and is idempotent', async () => {
    await migrate(db);
    await migrate(db);
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(row?.user_version).toBe(SCHEMA_VERSION);
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      [],
    );
    expect(tables.map((t) => t.name)).toEqual(['foods', 'log_entries']);
  });

  it('enforces source and meal checks and the food foreign key', async () => {
    await expect(
      upsertFood(db, { ...custom('x', 'X'), source: 'bad' as Food['source'] }),
    ).rejects.toThrow();
    await expect(
      db.runAsync(
        "INSERT INTO log_entries (id, date, meal, food_id, grams, created_at) VALUES ('e', '2026-01-01', 'lunch', 'missing', 10, 'now')",
        [],
      ),
    ).rejects.toThrow();
  });
});

describe('seed', () => {
  it('inserts ~50 common foods once', async () => {
    expect(await seedCommonFoods(db)).toBe(true);
    expect(await seedCommonFoods(db)).toBe(false);
    const row = await db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM foods WHERE source = 'common'",
      [],
    );
    expect(row?.n).toBe(COMMON_FOODS.length);
    expect(COMMON_FOODS.length).toBeGreaterThanOrEqual(45);
    expect(COMMON_FOODS.length).toBeLessThanOrEqual(65);
  });

  it('has unique ids and complete servings', () => {
    expect(new Set(COMMON_FOODS.map((f) => f.id)).size).toBe(COMMON_FOODS.length);
    for (const food of COMMON_FOODS) {
      expect(food.id).toMatch(/^common:[a-z0-9-]+$/);
      expect(food.servingName).toBeTruthy();
      expect(food.servingGrams).toBeGreaterThan(0);
      const { kcal, protein, carbs, fat } = food.per100g;
      expect(protein + carbs + fat).toBeLessThanOrEqual(100);
      // Energy roughly consistent with macros (Atwater), allowing for fibre/alcohol/rounding.
      expect(Math.abs(kcal - (4 * protein + 4 * carbs + 9 * fat))).toBeLessThan(0.2 * kcal + 15);
    }
  });

  it('round-trips a seeded food', async () => {
    await seedCommonFoods(db);
    expect(await getFood(db, 'common:ou-fiert')).toEqual(
      COMMON_FOODS.find((f) => f.id === 'common:ou-fiert'),
    );
  });
});

describe('searchFoods', () => {
  beforeEach(() => seedCommonFoods(db));

  it('is case- and diacritics-insensitive', async () => {
    const names = (await searchFoods(db, 'branza')).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Brânză telemea', 'Brânză de vaci']));
    expect((await searchFoods(db, 'CIORBĂ')).length).toBe(3);
    expect((await searchFoods(db, 'ceafa')).map((f) => f.id)).toEqual(['common:ceafa-de-porc']);
  });

  it('orders prefix matches before substring matches, then by name', async () => {
    const names = (await searchFoods(db, 'branza')).map((f) => f.name);
    expect(names).toEqual(['Brânză de vaci', 'Brânză telemea', 'Plăcintă cu brânză']);
  });

  it('filters by source and respects limit', async () => {
    await upsertFood(db, custom('c1', 'Brânză de capră'));
    expect((await searchFoods(db, 'branza', { sources: ['custom'] })).map((f) => f.id)).toEqual([
      'c1',
    ]);
    expect(await searchFoods(db, 'a', { limit: 5 })).toHaveLength(5);
    expect(await searchFoods(db, '   ')).toEqual([]);
  });

  it('treats LIKE wildcards literally', async () => {
    expect(await searchFoods(db, '_')).toEqual([]);
    expect((await searchFoods(db, '%')).map((f) => f.id)).toEqual([
      'common:ciocolata-neagra',
      'common:lapte-1-5',
      'common:smantana',
    ]);
    expect((await searchFoods(db, '1,5%')).map((f) => f.id)).toEqual(['common:lapte-1-5']);
  });
});

describe('foods', () => {
  it('upserts in place and maps optional fields', async () => {
    await upsertFood(
      db,
      custom('c1', 'Supă', {
        brand: 'Acasă',
        servingName: 'bol',
        servingGrams: 300,
      }),
    );
    await upsertFood(
      db,
      custom('c1', 'Supă cremă', {
        per100g: { kcal: 60, protein: 2, carbs: 8, fat: 2 },
      }),
    );
    const food = await getFood(db, 'c1');
    expect(food).toEqual({
      id: 'c1',
      name: 'Supă cremă',
      per100g: { kcal: 60, protein: 2, carbs: 8, fat: 2 },
      source: 'custom',
    });
    expect((await searchFoods(db, 'supa crema')).map((f) => f.id)).toEqual(['c1']);
    expect(await getFood(db, 'missing')).toBeNull();
  });

  it('finds a food by barcode', async () => {
    await upsertFood(db, {
      ...custom('off:594', 'Iaurt'),
      source: 'off',
      barcode: '594',
    });
    expect((await getFoodByBarcode(db, '594'))?.id).toBe('off:594');
    expect(await getFoodByBarcode(db, '000')).toBeNull();
  });

  it('lists recent foods by last use and custom foods by name', async () => {
    await seedCommonFoods(db);
    await upsertFood(db, custom('c2', 'Zacuscă de casă'));
    await upsertFood(db, custom('c1', 'Ardei umpluți'));
    await markFoodUsed(db, 'common:mar', '2026-11-18T08:00:00.000Z');
    await markFoodUsed(db, 'c1', '2026-11-18T12:00:00.000Z');
    await markFoodUsed(db, 'common:cozonac', '2026-11-17T12:00:00.000Z');
    expect((await recentFoods(db, 10)).map((f) => f.id)).toEqual([
      'c1',
      'common:mar',
      'common:cozonac',
    ]);
    expect(await recentFoods(db, 1)).toHaveLength(1);
    expect((await myFoods(db)).map((f) => f.id)).toEqual(['c1', 'c2']);
  });
});
