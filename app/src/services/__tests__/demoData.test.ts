/** @jest-environment node */
import { addEntry, entriesForDate } from '@/db/logRepo';
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import { demoEntries } from '@/lib/demoSeed';
import { clearDemoData, hasDemoData, seedDemoData } from '@/services/demoData';

const mockStore = new Map<string, string>();
let mockUuid = 0;

jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItemSync: (key: string) => mockStore.get(key) ?? null,
    setItemSync: (key: string, value: string) => mockStore.set(key, value),
    removeItemSync: (key: string) => mockStore.delete(key),
  },
}));

const today = new Date(2026, 10, 19);
let db: TestDb;

beforeEach(async () => {
  mockStore.clear();
  mockUuid = 0;
  db = createTestDb();
  await migrate(db);
  await seedCommonFoods(db);
});
afterEach(() => db.close());

describe('demo data', () => {
  it('seeds the sample week once', async () => {
    const count = await seedDemoData(db, today);
    expect(count).toBe(demoEntries(today).length);
    expect(hasDemoData()).toBe(true);
    expect(await seedDemoData(db, today)).toBe(0);
    expect((await entriesForDate(db, '2026-11-19')).length).toBeGreaterThan(0);
  });

  it('clears only demo entries', async () => {
    const own = await addEntry(db, {
      date: '2026-11-19',
      meal: 'snack',
      foodId: 'common:mar',
      grams: 150,
    });
    await seedDemoData(db, today);
    await clearDemoData(db);
    expect(hasDemoData()).toBe(false);
    expect((await entriesForDate(db, '2026-11-19')).map((e) => e.id)).toEqual([own.id]);
  });
});
