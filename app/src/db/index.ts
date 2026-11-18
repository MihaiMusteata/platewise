import { openDatabaseAsync } from 'expo-sqlite';

import { migrate } from './schema';
import { seedCommonFoods } from './seed';
import type { Db } from './types';

export const DB_NAME = 'platewise.db';

let dbPromise: Promise<Db> | null = null;

async function open(): Promise<Db> {
  const db: Db = await openDatabaseAsync(DB_NAME);
  await migrate(db);
  await seedCommonFoods(db);
  return db;
}

/** The app database, opened, migrated and seeded once per launch. */
export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = open().catch((error: unknown) => {
      dbPromise = null; // allow a retry after a failed open
      throw error;
    });
  }
  return dbPromise;
}

export * from './foodsRepo';
export * from './logRepo';
export { COMMON_FOODS } from './seed';
export type { DailyTotals, Db, DbValue, LogEntryWithFood } from './types';
