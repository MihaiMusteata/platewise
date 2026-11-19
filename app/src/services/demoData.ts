import { addEntry, deleteEntry } from '@/db/logRepo';
import type { Db } from '@/db/types';
import { demoEntries } from '@/lib/demoSeed';
import { kvStorage } from '@/services/kvStorage';

const KEY = 'platewise.demoEntryIds';

function readIds(): string[] {
  try {
    const raw = kvStorage.getItem(KEY);
    const ids = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** True when the demo week is currently in the log. */
export function hasDemoData(): boolean {
  return readIds().length > 0;
}

/**
 * Logs a sample week (7 days ending today) of common foods. Entries are inserted one by one
 * (never concurrently) and their ids remembered so `clearDemoData` removes only them.
 */
export async function seedDemoData(db: Db, today = new Date()): Promise<number> {
  if (hasDemoData()) return 0;
  const ids: string[] = [];
  for (const entry of demoEntries(today)) {
    const saved = await addEntry(db, entry);
    ids.push(saved.id);
  }
  kvStorage.setItem(KEY, JSON.stringify(ids));
  return ids.length;
}

/** Removes the demo entries (entries the user logged themselves stay). */
export async function clearDemoData(db: Db): Promise<number> {
  const ids = readIds();
  for (const id of ids) await deleteEntry(db, id);
  kvStorage.removeItem(KEY);
  return ids.length;
}
