import * as SecureStore from 'expo-secure-store';

import { toMonthKey } from '@/lib/date';

/** Successful barcode lookups allowed per calendar month (free plan). */
export const SCAN_LIMIT = 10;

const KEY = 'platewise.scanCounter';
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

interface StoredCounter {
  month: string; // YYYY-MM, local
  count: number;
}

export interface ScanStatus {
  used: number;
  remaining: number;
  limit: number;
  limitReached: boolean;
}

export function statusFor(count: number): ScanStatus {
  const used = Math.min(count, SCAN_LIMIT);
  return {
    used,
    remaining: SCAN_LIMIT - used,
    limit: SCAN_LIMIT,
    limitReached: used >= SCAN_LIMIT,
  };
}

async function readCount(month: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(KEY, OPTIONS);
  if (!raw) return 0;
  try {
    const stored = JSON.parse(raw) as StoredCounter;
    return stored.month === month && Number.isFinite(stored.count) ? stored.count : 0;
  } catch {
    return 0;
  }
}

/** Scans used this calendar month; a new month starts again from 0. */
export async function getScanStatus(now = new Date()): Promise<ScanStatus> {
  return statusFor(await readCount(toMonthKey(now)));
}

/**
 * Counts one successful lookup (call only when a product was found).
 * "Not found" and offline lookups must not call this.
 */
export async function recordSuccessfulScan(now = new Date()): Promise<ScanStatus> {
  const month = toMonthKey(now);
  const count = (await readCount(month)) + 1;
  const stored: StoredCounter = { month, count };
  await SecureStore.setItemAsync(KEY, JSON.stringify(stored), OPTIONS);
  return statusFor(count);
}

/** Dev-only: clears the counter (hidden dev section in Settings). */
export async function resetScanCounter(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY, OPTIONS);
}
