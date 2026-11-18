/** @jest-environment node */
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import { toDateKey } from '@/lib/date';
import { useLogStore } from '@/stores/log';

let mockDb: TestDb;
let mockUuid = 0;

jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock('@/db/index', () => {
  const actual = jest.requireActual('@/db/logRepo');
  return { ...actual, getDb: async () => mockDb };
});

const today = toDateKey(new Date());

beforeEach(async () => {
  mockUuid = 0;
  mockDb = createTestDb();
  await migrate(mockDb);
  await seedCommonFoods(mockDb);
  useLogStore.setState({ date: today, entries: [], loaded: false, revision: 0 });
});

afterEach(() => mockDb.close());

describe('log store', () => {
  it('loads an empty day', async () => {
    await useLogStore.getState().load();
    expect(useLogStore.getState()).toMatchObject({ loaded: true, entries: [] });
  });

  it('adds an entry to today and reloads with nutrients', async () => {
    await useLogStore.getState().load();
    await useLogStore.getState().add({ meal: 'breakfast', foodId: 'common:ou-fiert', grams: 100 });
    const { entries, revision } = useLogStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].food.id).toBe('common:ou-fiert');
    expect(entries[0].nutrients.kcal).toBeGreaterThan(0);
    expect(revision).toBeGreaterThan(1);
  });

  it('adding to another day does not change the shown day', async () => {
    await useLogStore.getState().load();
    await useLogStore.getState().add({
      meal: 'lunch',
      foodId: 'common:ou-fiert',
      grams: 50,
      date: '2020-01-01',
    });
    expect(useLogStore.getState().entries).toHaveLength(0);
  });

  it('removes and restores an entry (undo)', async () => {
    await useLogStore.getState().load();
    const added = await useLogStore
      .getState()
      .add({ meal: 'dinner', foodId: 'common:ou-fiert', grams: 60 });
    const removed = await useLogStore.getState().remove(added.id);
    expect(useLogStore.getState().entries).toHaveLength(0);
    expect(removed?.id).toBe(added.id);
    await useLogStore.getState().restore(removed!);
    expect(useLogStore.getState().entries.map((e) => e.id)).toEqual([added.id]);
  });

  it('switches days', async () => {
    await useLogStore.getState().add({
      meal: 'snack',
      foodId: 'common:ou-fiert',
      grams: 50,
      date: '2020-01-01',
    });
    await useLogStore.getState().load('2020-01-01');
    expect(useLogStore.getState()).toMatchObject({ date: '2020-01-01' });
    expect(useLogStore.getState().entries).toHaveLength(1);
  });

  it('clears all data', async () => {
    await useLogStore.getState().add({ meal: 'snack', foodId: 'common:ou-fiert', grams: 50 });
    await useLogStore.getState().clearAll();
    expect(useLogStore.getState().entries).toHaveLength(0);
  });
});
