import type { Food, LogEntry, Nutrients } from '@/types/models';

export type DbValue = string | number | null;

/**
 * Minimal database surface used by the repositories. expo-sqlite's `SQLiteDatabase`
 * satisfies it structurally; tests provide an in-memory adapter.
 */
export interface Db {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: DbValue[]): Promise<unknown>;
  getAllAsync<T>(source: string, params: DbValue[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params: DbValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

/** A log entry joined with its food and the nutrients for the logged grams. */
export interface LogEntryWithFood extends LogEntry {
  food: Food;
  nutrients: Nutrients;
}

export interface DailyTotals extends Nutrients {
  date: string; // YYYY-MM-DD
}
