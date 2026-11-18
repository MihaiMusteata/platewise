import { randomUUID } from 'expo-crypto';

import { nutrientsFor } from '@/lib/nutrition';
import type { LogEntry, Meal } from '@/types/models';

import { FOOD_COLUMNS, markFoodUsed, rowToFood, type FoodRow } from './foodsRepo';
import type { DailyTotals, Db, LogEntryWithFood } from './types';

export interface NewEntry {
  date: string; // YYYY-MM-DD local
  meal: Meal;
  foodId: string;
  grams: number;
}

async function insertEntry(db: Db, entry: LogEntry): Promise<void> {
  await db.runAsync(
    'INSERT INTO log_entries (id, date, meal, food_id, grams, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [entry.id, entry.date, entry.meal, entry.foodId, entry.grams, entry.createdAt],
  );
}

/** Logs a food portion and marks the food as recently used. */
export async function addEntry(
  db: Db,
  input: NewEntry,
  now = new Date().toISOString(),
): Promise<LogEntry> {
  const entry: LogEntry = { id: randomUUID(), ...input, createdAt: now };
  await db.withTransactionAsync(async () => {
    await insertEntry(db, entry);
    await markFoodUsed(db, entry.foodId, now);
  });
  return entry;
}

export async function deleteEntry(db: Db, id: string): Promise<void> {
  await db.runAsync('DELETE FROM log_entries WHERE id = ?', [id]);
}

/** Re-inserts a deleted entry with its original id (undo). */
export async function restoreEntry(db: Db, entry: LogEntry): Promise<void> {
  await insertEntry(db, entry);
}

type EntryJoinRow = FoodRow & {
  entry_id: string;
  entry_date: string;
  entry_meal: Meal;
  entry_grams: number;
  entry_created_at: string;
};

const FOOD_COLUMNS_PREFIXED = FOOD_COLUMNS.split(', ')
  .map((c) => `f.${c}`)
  .join(', ');

function toEntryWithFood(row: EntryJoinRow): LogEntryWithFood {
  const food = rowToFood(row);
  return {
    id: row.entry_id,
    date: row.entry_date,
    meal: row.entry_meal,
    foodId: food.id,
    grams: row.entry_grams,
    createdAt: row.entry_created_at,
    food,
    nutrients: nutrientsFor(food.per100g, row.entry_grams),
  };
}

const ENTRY_SELECT = `SELECT e.id AS entry_id, e.date AS entry_date, e.meal AS entry_meal,
       e.grams AS entry_grams, e.created_at AS entry_created_at, ${FOOD_COLUMNS_PREFIXED}
     FROM log_entries e JOIN foods f ON f.id = e.food_id`;

/** Entries of one day in insertion order, with food and computed nutrients. */
export async function entriesForDate(db: Db, date: string): Promise<LogEntryWithFood[]> {
  const rows = await db.getAllAsync<EntryJoinRow>(
    `${ENTRY_SELECT} WHERE e.date = ? ORDER BY e.created_at, e.rowid`,
    [date],
  );
  return rows.map(toEntryWithFood);
}

/** All entries, oldest first (for CSV export). */
export async function allEntries(db: Db): Promise<LogEntryWithFood[]> {
  const rows = await db.getAllAsync<EntryJoinRow>(
    `${ENTRY_SELECT} ORDER BY e.date, e.created_at, e.rowid`,
    [],
  );
  return rows.map(toEntryWithFood);
}

/** Per-day totals for days with entries in [fromDate, toDate] (inclusive), ascending. */
export async function dailyTotals(
  db: Db,
  fromDate: string,
  toDate: string,
): Promise<DailyTotals[]> {
  return db.getAllAsync<DailyTotals>(
    `SELECT e.date AS date,
       SUM(f.kcal * e.grams / 100.0) AS kcal,
       SUM(f.protein * e.grams / 100.0) AS protein,
       SUM(f.carbs * e.grams / 100.0) AS carbs,
       SUM(f.fat * e.grams / 100.0) AS fat
     FROM log_entries e JOIN foods f ON f.id = e.food_id
     WHERE e.date BETWEEN ? AND ?
     GROUP BY e.date
     ORDER BY e.date`,
    [fromDate, toDate],
  );
}

/** Wipes the log and every non-common food; common foods stay but lose their "recent" mark. */
export async function deleteAllData(db: Db): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM log_entries', []);
    await db.runAsync("DELETE FROM foods WHERE source <> 'common'", []);
    await db.runAsync('UPDATE foods SET last_used_at = NULL', []);
  });
}
