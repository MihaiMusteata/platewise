/** @jest-environment node */
import { getFoodByBarcode, upsertFood } from '@/db/foodsRepo';
import { migrate } from '@/db/schema';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import { lookupBarcode } from '@/services/barcodeLookup';
import type { BarcodeLookup, FoodApi } from '@/services/foodApi';
import { SCAN_LIMIT } from '@/services/scanCounter';
import type { Food } from '@/types/models';

const mockKeychain = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 0,
  getItemAsync: async (key: string) => mockKeychain.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    mockKeychain.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    mockKeychain.delete(key);
  },
}));

const food: Food = {
  id: 'off:5941234567890',
  name: 'Iaurt grecesc',
  barcode: '5941234567890',
  per100g: { kcal: 97, protein: 9, carbs: 3.5, fat: 5 },
  source: 'off',
};

function apiReturning(result: BarcodeLookup) {
  const lookup = jest.fn(async (): Promise<BarcodeLookup> => result);
  const api: FoodApi = { lookupBarcode: lookup, search: jest.fn() };
  return { api, lookup };
}

const now = new Date(2026, 10, 18);
let db: TestDb;

beforeEach(async () => {
  mockKeychain.clear();
  db = createTestDb();
  await migrate(db);
});
afterEach(() => db.close());

describe('lookupBarcode', () => {
  it('caches a found product and counts one scan', async () => {
    const { api } = apiReturning({ status: 'found', food });
    const result = await lookupBarcode(db, api, '5941234567890', now);
    expect(result).toMatchObject({ status: 'found', cached: false, scans: { used: 1 } });
    expect(await getFoodByBarcode(db, '5941234567890')).toMatchObject({ name: 'Iaurt grecesc' });
  });

  it('serves a product already on the device without a network call or scan', async () => {
    await upsertFood(db, food);
    const { api, lookup } = apiReturning({ status: 'not_found' });
    const result = await lookupBarcode(db, api, '5941234567890', now);
    expect(result).toMatchObject({ status: 'found', cached: true, scans: { used: 0 } });
    expect(lookup).not.toHaveBeenCalled();
  });

  it.each(['not_found', 'offline', 'error'] as const)('%s does not count', async (status) => {
    const { api } = apiReturning({ status });
    const result = await lookupBarcode(db, api, '5941234567890', now);
    expect(result).toMatchObject({ status, scans: { used: 0 } });
  });

  it('stops before the network at the monthly limit', async () => {
    mockKeychain.set('platewise.scanCounter', JSON.stringify({ month: '2026-11', count: SCAN_LIMIT }));
    const { api, lookup } = apiReturning({ status: 'found', food });
    const result = await lookupBarcode(db, api, '5941234567890', now);
    expect(result).toMatchObject({ status: 'limit', scans: { remaining: 0 } });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('still serves cached products at the limit', async () => {
    mockKeychain.set('platewise.scanCounter', JSON.stringify({ month: '2026-11', count: SCAN_LIMIT }));
    await upsertFood(db, food);
    const { api } = apiReturning({ status: 'not_found' });
    expect((await lookupBarcode(db, api, '5941234567890', now)).status).toBe('found');
  });
});
