import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { Text } from 'react-native';

import ScanFlowLayout from '@/app/scan/_layout';
import ScanNotFoundScreen from '@/app/scan/not-found';
import ScanProductScreen from '@/app/scan/product/[barcode]';
import { entriesForDate, upsertFood } from '@/db/index';
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import { strings } from '@/i18n';
import { toDateKey } from '@/lib/date';
import type { ScanResult } from '@/services/barcodeLookup';
import { statusFor } from '@/services/scanCounter';
import { useLogStore } from '@/stores/log';
import type { Food } from '@/types/models';

let mockDb: TestDb;
let mockUuid = 0;
const mockLookup = jest.fn<Promise<ScanResult>, [unknown, unknown, string]>();

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock('@/db/index', () => ({
  ...jest.requireActual('@/db/logRepo'),
  ...jest.requireActual('@/db/foodsRepo'),
  getDb: async () => mockDb,
}));
jest.mock('@/services/barcodeLookup', () => ({
  lookupBarcode: (db: unknown, api: unknown, barcode: string) => mockLookup(db, api, barcode),
}));

const coke: Food = {
  id: 'off:5449000000996',
  name: 'Original Taste',
  brand: 'Coca-Cola',
  barcode: '5449000000996',
  per100g: { kcal: 42, protein: 0, carbs: 10.6, fat: 0 },
  servingName: 'porție',
  servingGrams: 330,
  source: 'off',
};

const Home = () => <Text>home</Text>;
const Scanner = () => <Text>scanner</Text>;
const Search = () => <Text>search</Text>;

const routes = {
  '(tabs)/index': Home,
  'scan/_layout': ScanFlowLayout,
  'scan/index': Scanner,
  'scan/product/[barcode]': ScanProductScreen,
  'scan/not-found': ScanNotFoundScreen,
  'add/index': Search,
};

const openProduct = async (barcode: string) => {
  await renderRouter(routes, { initialUrl: '/' });
  await act(async () => router.push('/scan'));
  await act(async () =>
    router.push({ pathname: '/scan/product/[barcode]', params: { barcode } }),
  );
};

beforeEach(async () => {
  mockUuid = 0;
  mockLookup.mockReset();
  mockDb = createTestDb();
  await migrate(mockDb);
  await seedCommonFoods(mockDb);
  useLogStore.setState({ date: toDateKey(new Date()), entries: [], loaded: false, revision: 0 });
});

afterEach(() => mockDb.close());

describe('Scan result', () => {
  it('shows a found product and adds it to the log, then closes the scan flow', async () => {
    await upsertFood(mockDb, coke); // the lookup caches it before answering
    mockLookup.mockResolvedValue({ status: 'found', food: coke, cached: false, scans: statusFor(3) });
    await openProduct('5449000000996');

    expect(await screen.findByTestId('log-name')).toHaveTextContent('Original Taste');
    expect(mockLookup.mock.calls[0][2]).toBe('5449000000996');
    expect(screen.getByText(strings.scanResult.found.title)).toBeTruthy();
    expect(screen.getByTestId('log-subtitle')).toHaveTextContent(
      'Coca-Cola · 1 porție = 330 g · Cod 5449000000996',
    );
    expect(screen.getByTestId('log-kcal')).toHaveTextContent('139'); // 330 g × 0,42
    expect(screen.getByTestId('log-attribution')).toHaveTextContent(strings.scanResult.found.attribution);

    await fireEvent.press(screen.getByTestId('log-meal-snack'));
    await fireEvent.press(screen.getByTestId('log-save'));

    expect(screen).toHavePathname('/');
    const entries = await entriesForDate(mockDb, toDateKey(new Date()));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ foodId: coke.id, meal: 'snack', grams: 330 });
  });

  it('replaces itself with "not found" for an unknown code', async () => {
    mockLookup.mockResolvedValue({ status: 'not_found', scans: statusFor(3) });
    await openProduct('2000000000008');

    expect(await screen.findByText(strings.scanResult.notFound.title)).toBeTruthy();
    expect(screen).toHavePathname('/scan/not-found');
    expect(screen.getByText(strings.scanResult.notFound.body)).toBeTruthy();
    expect(screen.getByTestId('not-found-code')).toHaveTextContent('Cod 2000000000008');

    // Back goes to the scanner, not to the replaced product screen.
    await fireEvent.press(screen.getByTestId('not-found-rescan'));
    expect(screen).toHavePathname('/scan');
  });

  it('shows the offline state with recent foods and retries', async () => {
    await upsertFood(mockDb, coke);
    await useLogStore.getState().add({ meal: 'lunch', foodId: coke.id, grams: 330 });
    mockLookup.mockResolvedValueOnce({ status: 'offline', scans: statusFor(3) });
    await openProduct('5449000000996');

    expect(await screen.findByText(strings.scanResult.offline.title)).toBeTruthy();
    expect(screen.getByText(strings.scanResult.offline.body)).toBeTruthy();
    expect(screen.getByTestId(`product-recent-${coke.id}`)).toBeTruthy();

    mockLookup.mockResolvedValueOnce({
      status: 'found',
      food: coke,
      cached: false,
      scans: statusFor(4),
    });
    await fireEvent.press(screen.getByTestId('product-retry'));
    expect(await screen.findByTestId('log-name')).toHaveTextContent('Original Taste');
    expect(mockLookup).toHaveBeenCalledTimes(2);
  });

  it('offers a search of my foods while offline', async () => {
    mockLookup.mockResolvedValue({ status: 'error', scans: statusFor(3) });
    await openProduct('5449000000996');

    expect(await screen.findByText(strings.scanResult.error.title)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('product-search'));
    expect(screen).toHavePathname('/add');
    expect(screen).toHaveSearchParams({ filter: 'mine', meal: expect.any(String) });
  });

  it('shows a calm limit message with manual search and closing', async () => {
    mockLookup.mockResolvedValue({ status: 'limit', scans: statusFor(10) });
    await openProduct('5449000000996');

    expect(await screen.findByText(strings.scanLimit.title)).toBeTruthy();
    expect(
      screen.getByText(/Ai folosit cele 10 scanări din luna aceasta\. Poți căuta manual oricând; scanările revin pe 1 /),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('product-close'));
    expect(screen).toHavePathname('/');
  });
});
