import type { Db } from './types';

export const SCHEMA_VERSION = 1;

const MIGRATIONS: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      search_name TEXT NOT NULL,
      brand TEXT,
      barcode TEXT,
      kcal REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      serving_name TEXT,
      serving_grams REAL,
      source TEXT NOT NULL CHECK (source IN ('off', 'custom', 'common')),
      created_at TEXT NOT NULL,
      last_used_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods (barcode);
    CREATE INDEX IF NOT EXISTS idx_foods_search_name ON foods (search_name);
    CREATE INDEX IF NOT EXISTS idx_foods_name_lower ON foods (lower(name));
    CREATE INDEX IF NOT EXISTS idx_foods_last_used ON foods (last_used_at);

    CREATE TABLE IF NOT EXISTS log_entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      meal TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
      food_id TEXT NOT NULL REFERENCES foods (id),
      grams REAL NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_log_entries_date ON log_entries (date);
  `,
};

/** Applies pending migrations, tracked with `PRAGMA user_version`. Safe to call repeatedly. */
export async function migrate(db: Db): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const current = row?.user_version ?? 0;

  for (let version = current + 1; version <= SCHEMA_VERSION; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      // PRAGMA does not accept bound parameters; `version` is a trusted integer.
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}
