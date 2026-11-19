/** @jest-environment node */
import * as Sharing from 'expo-sharing';

import { addEntry } from '@/db/logRepo';
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import { exportFileName, exportLogCsv } from '@/services/exportCsv';

let mockDb: TestDb;
let mockUuid = 0;
const mockFiles = new Map<string, string>();

jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock('@/db/index', () => {
  const actual = jest.requireActual('@/db/logRepo');
  return { ...actual, getDb: async () => mockDb };
});
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => {}) }));
jest.mock('expo-file-system', () => {
  class MockFile {
    uri: string;
    constructor(dir: { uri: string }, name: string) {
      this.uri = `${dir.uri}${name}`;
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    delete() {
      mockFiles.delete(this.uri);
    }
    create() {
      mockFiles.set(this.uri, '');
    }
    async write(content: string) {
      mockFiles.set(this.uri, content);
    }
  }
  return { File: MockFile, Paths: { cache: { uri: 'file:///cache/' } } };
});

const TODAY = new Date(2026, 10, 19, 12);
const URI = 'file:///cache/platewise-jurnal-2026-11-19.csv';

beforeEach(async () => {
  mockUuid = 0;
  mockFiles.clear();
  jest.mocked(Sharing.shareAsync).mockClear();
  mockDb = createTestDb();
  await migrate(mockDb);
  await seedCommonFoods(mockDb);
});

describe('exportLogCsv', () => {
  it('names the file by date', () => {
    expect(exportFileName(TODAY)).toBe('platewise-jurnal-2026-11-19.csv');
  });

  it('returns empty and shares nothing when the log is empty', async () => {
    expect(await exportLogCsv(TODAY)).toBe('empty');
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    expect(mockFiles.size).toBe(0);
  });

  it('writes the log to the cache and opens the share sheet as CSV', async () => {
    await addEntry(mockDb, { date: '2026-11-19', meal: 'lunch', foodId: 'common:ou-fiert', grams: 100 });
    mockFiles.set(URI, 'old export');

    expect(await exportLogCsv(TODAY)).toBe('shared');

    const csv = mockFiles.get(URI) ?? '';
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('Data;Masă;Aliment;Marcă;Grame;kcal;Proteine (g);Carbohidrați (g);Grăsimi (g)');
    expect(lines[1]).toMatch(/^2026-11-19;Prânz;.+;;100;/);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(URI, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  });
});
