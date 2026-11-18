import { normalizeForSearch } from '@/lib/text';
import type { Food } from '@/types/models';

import type { Db, DbValue } from './types';

export interface FoodRow {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_name: string | null;
  serving_grams: number | null;
  source: Food['source'];
  created_at: string;
  last_used_at: string | null;
}

export const FOOD_COLUMNS =
  'id, name, brand, barcode, kcal, protein, carbs, fat, serving_name, serving_grams, source, created_at, last_used_at';

export function rowToFood(row: FoodRow): Food {
  const food: Food = {
    id: row.id,
    name: row.name,
    per100g: {
      kcal: row.kcal,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
    },
    source: row.source,
  };
  if (row.brand != null) food.brand = row.brand;
  if (row.barcode != null) food.barcode = row.barcode;
  if (row.serving_name != null) food.servingName = row.serving_name;
  if (row.serving_grams != null) food.servingGrams = row.serving_grams;
  return food;
}

/** Inserts a food or updates it in place (keeps `created_at` and `last_used_at`). */
export async function upsertFood(
  db: Db,
  food: Food,
  now = new Date().toISOString(),
): Promise<void> {
  await db.runAsync(
    `INSERT INTO foods (id, name, search_name, brand, barcode, kcal, protein, carbs, fat,
       serving_name, serving_grams, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       name = excluded.name,
       search_name = excluded.search_name,
       brand = excluded.brand,
       barcode = excluded.barcode,
       kcal = excluded.kcal,
       protein = excluded.protein,
       carbs = excluded.carbs,
       fat = excluded.fat,
       serving_name = excluded.serving_name,
       serving_grams = excluded.serving_grams,
       source = excluded.source`,
    [
      food.id,
      food.name,
      normalizeForSearch(food.name),
      food.brand ?? null,
      food.barcode ?? null,
      food.per100g.kcal,
      food.per100g.protein,
      food.per100g.carbs,
      food.per100g.fat,
      food.servingName ?? null,
      food.servingGrams ?? null,
      food.source,
      now,
    ],
  );
}

export async function getFood(db: Db, id: string): Promise<Food | null> {
  const row = await db.getFirstAsync<FoodRow>(`SELECT ${FOOD_COLUMNS} FROM foods WHERE id = ?`, [
    id,
  ]);
  return row ? rowToFood(row) : null;
}

/** Most recently used (then most recently added) food with this barcode. */
export async function getFoodByBarcode(db: Db, barcode: string): Promise<Food | null> {
  const row = await db.getFirstAsync<FoodRow>(
    `SELECT ${FOOD_COLUMNS} FROM foods WHERE barcode = ?
     ORDER BY last_used_at IS NULL, last_used_at DESC, created_at DESC LIMIT 1`,
    [barcode],
  );
  return row ? rowToFood(row) : null;
}

export interface SearchOptions {
  limit?: number;
  sources?: Food['source'][];
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (ch) => `\\${ch}`);

/**
 * Case- and diacritics-insensitive substring search on the name.
 * Names starting with the query come first, then alphabetical.
 */
export async function searchFoods(
  db: Db,
  query: string,
  { limit = 30, sources }: SearchOptions = {},
): Promise<Food[]> {
  const q = escapeLike(normalizeForSearch(query));
  if (!q) return [];
  if (sources && sources.length === 0) return [];

  const params: DbValue[] = [`%${q}%`];
  let sourceFilter = '';
  if (sources) {
    sourceFilter = ` AND source IN (${sources.map(() => '?').join(', ')})`;
    params.push(...sources);
  }
  params.push(`${q}%`, limit);

  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${FOOD_COLUMNS} FROM foods
     WHERE search_name LIKE ? ESCAPE '\\'${sourceFilter}
     ORDER BY CASE WHEN search_name LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END, search_name, id
     LIMIT ?`,
    params,
  );
  return rows.map(rowToFood);
}

/** Foods ordered by last use, most recent first. */
export async function recentFoods(db: Db, limit = 20): Promise<Food[]> {
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${FOOD_COLUMNS} FROM foods WHERE last_used_at IS NOT NULL
     ORDER BY last_used_at DESC, id LIMIT ?`,
    [limit],
  );
  return rows.map(rowToFood);
}

export async function markFoodUsed(
  db: Db,
  id: string,
  at = new Date().toISOString(),
): Promise<void> {
  await db.runAsync('UPDATE foods SET last_used_at = ? WHERE id = ?', [at, id]);
}

/** Foods the user created ("Alimentele mele"), alphabetical. */
export async function myFoods(db: Db): Promise<Food[]> {
  const rows = await db.getAllAsync<FoodRow>(
    `SELECT ${FOOD_COLUMNS} FROM foods WHERE source = 'custom' ORDER BY search_name, id`,
    [],
  );
  return rows.map(rowToFood);
}
