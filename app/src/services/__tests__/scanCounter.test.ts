import {
  getScanStatus,
  recordSuccessfulScan,
  resetScanCounter,
  SCAN_LIMIT,
} from '@/services/scanCounter';

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

const nov = new Date(2026, 10, 18);
const lateNov = new Date(2026, 10, 30, 23, 59);
const dec = new Date(2026, 11, 1, 0, 1);

describe('scan counter', () => {
  beforeEach(() => mockKeychain.clear());

  it('starts with the full monthly allowance', async () => {
    expect(await getScanStatus(nov)).toEqual({
      used: 0,
      remaining: SCAN_LIMIT,
      limit: 10,
      limitReached: false,
    });
  });

  it('counts successful lookups', async () => {
    await recordSuccessfulScan(nov);
    const status = await recordSuccessfulScan(lateNov);
    expect(status.used).toBe(2);
    expect((await getScanStatus(nov)).remaining).toBe(8);
  });

  it('a not-found lookup does not count (nothing is recorded)', async () => {
    await recordSuccessfulScan(nov);
    // Callers only record found products; reading status never changes it.
    await getScanStatus(nov);
    expect((await getScanStatus(nov)).used).toBe(1);
  });

  it('reaches the limit at 10 and never goes past it', async () => {
    for (let i = 0; i < SCAN_LIMIT; i++) await recordSuccessfulScan(nov);
    expect(await getScanStatus(nov)).toMatchObject({ remaining: 0, limitReached: true });
    expect(await recordSuccessfulScan(nov)).toMatchObject({ used: 10, remaining: 0 });
  });

  it('starts again in a new calendar month', async () => {
    for (let i = 0; i < SCAN_LIMIT; i++) await recordSuccessfulScan(lateNov);
    expect((await getScanStatus(dec)).remaining).toBe(SCAN_LIMIT);
    expect((await recordSuccessfulScan(dec)).used).toBe(1);
  });

  it('treats corrupt storage as zero', async () => {
    mockKeychain.set('platewise.scanCounter', 'not json');
    expect((await getScanStatus(nov)).used).toBe(0);
  });

  it('can be reset', async () => {
    await recordSuccessfulScan(nov);
    await resetScanCounter();
    expect((await getScanStatus(nov)).used).toBe(0);
  });
});
