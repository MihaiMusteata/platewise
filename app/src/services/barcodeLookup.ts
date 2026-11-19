import { getFoodByBarcode, upsertFood } from '@/db/foodsRepo';
import type { Db } from '@/db/types';
import type { FoodApi } from '@/services/foodApi';
import { getScanStatus, recordSuccessfulScan, type ScanStatus } from '@/services/scanCounter';
import type { Food } from '@/types/models';

export type ScanResult =
  | { status: 'found'; food: Food; cached: boolean; scans: ScanStatus }
  | { status: 'not_found'; scans: ScanStatus }
  | { status: 'offline'; scans: ScanStatus }
  | { status: 'error'; scans: ScanStatus }
  | { status: 'limit'; scans: ScanStatus };

/**
 * Resolves a scanned barcode:
 * 1. a product already on the device (cached or custom) is returned without a network call
 *    and does not use a scan;
 * 2. at the monthly limit, no network call is made;
 * 3. otherwise Open Food Facts is asked; a found product is cached and counts as one scan.
 *    "Not found", offline and errors never count.
 */
export async function lookupBarcode(
  db: Db,
  api: FoodApi,
  barcode: string,
  now = new Date(),
): Promise<ScanResult> {
  const code = barcode.trim();
  const local = await getFoodByBarcode(db, code);
  const scans = await getScanStatus(now);
  if (local) return { status: 'found', food: local, cached: true, scans };
  if (scans.limitReached) return { status: 'limit', scans };

  const result = await api.lookupBarcode(code);
  if (result.status !== 'found') return { status: result.status, scans };

  await upsertFood(db, result.food);
  const updated = await recordSuccessfulScan(now);
  return { status: 'found', food: result.food, cached: false, scans: updated };
}
