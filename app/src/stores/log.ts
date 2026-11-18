import { create } from 'zustand';

import {
  addEntry,
  deleteAllData,
  deleteEntry,
  entriesForDate,
  getDb,
  type LogEntryWithFood,
  type NewEntry,
  restoreEntry,
} from '@/db';
import { toDateKey } from '@/lib/date';
import type { LogEntry } from '@/types/models';

interface LogState {
  /** Day shown on Home, YYYY-MM-DD local. */
  date: string;
  entries: LogEntryWithFood[];
  loaded: boolean;
  /** Increments on every change so other screens (Progress) can refresh. */
  revision: number;
  load: (date?: string) => Promise<void>;
  add: (input: Omit<NewEntry, 'date'> & { date?: string }) => Promise<LogEntry>;
  /** Deletes an entry and returns it so the caller can offer undo. */
  remove: (id: string) => Promise<LogEntryWithFood | undefined>;
  restore: (entry: LogEntryWithFood) => Promise<void>;
  /** Wipes the log and non-common foods ("Șterge toate datele mele"). */
  clearAll: () => Promise<void>;
}

export const useLogStore = create<LogState>()((set, get) => {
  const reload = async () => {
    const db = await getDb();
    const entries = await entriesForDate(db, get().date);
    set((state) => ({ entries, loaded: true, revision: state.revision + 1 }));
  };

  return {
    date: toDateKey(new Date()),
    entries: [],
    loaded: false,
    revision: 0,

    load: async (date) => {
      if (date && date !== get().date) set({ date, entries: [], loaded: false });
      await reload();
    },

    add: async ({ date, ...input }) => {
      const db = await getDb();
      const entry = await addEntry(db, { ...input, date: date ?? toDateKey(new Date()) });
      if (entry.date === get().date) await reload();
      else set((state) => ({ revision: state.revision + 1 }));
      return entry;
    },

    remove: async (id) => {
      const removed = get().entries.find((e) => e.id === id);
      // Optimistic: hide the row immediately, then persist.
      set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
      const db = await getDb();
      await deleteEntry(db, id);
      set((state) => ({ revision: state.revision + 1 }));
      return removed;
    },

    restore: async ({ id, date, meal, foodId, grams, createdAt }) => {
      const db = await getDb();
      await restoreEntry(db, { id, date, meal, foodId, grams, createdAt });
      await reload();
    },

    clearAll: async () => {
      const db = await getDb();
      await deleteAllData(db);
      await reload();
    },
  };
});
