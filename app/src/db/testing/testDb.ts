import type { Db, DbValue } from '../types';

interface StatementSync {
  run(...params: DbValue[]): unknown;
  all(...params: DbValue[]): Record<string, unknown>[];
  get(...params: DbValue[]): Record<string, unknown> | undefined;
}

interface DatabaseSync {
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
  close(): void;
}

type DatabaseSyncCtor = new (path: string) => DatabaseSync;

// Node's built-in SQLite (Node >= 22.5). Loaded via require so the app's TS config
// does not need Node typings.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync: NodeDatabaseSync } = require('node:sqlite') as {
  DatabaseSync: DatabaseSyncCtor;
};

export interface TestDb extends Db {
  close(): void;
}

/** In-memory `Db` over node:sqlite, for repository tests. */
export function createTestDb(): TestDb {
  const sqlite = new NodeDatabaseSync(':memory:');
  return {
    async execAsync(source) {
      sqlite.exec(source);
    },
    async runAsync(source, params) {
      return sqlite.prepare(source).run(...params);
    },
    async getAllAsync<T>(source: string, params: DbValue[]) {
      return sqlite
        .prepare(source)
        .all(...params)
        .map((row) => ({ ...row }) as T);
    },
    async getFirstAsync<T>(source: string, params: DbValue[]) {
      const row = sqlite.prepare(source).get(...params);
      return row ? ({ ...row } as T) : null;
    },
    async withTransactionAsync(task) {
      // Same semantics as expo-sqlite: plain BEGIN, so nesting fails loudly.
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    close() {
      sqlite.close();
    },
  };
}
