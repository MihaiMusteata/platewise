import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { Text } from 'react-native';

import ScanFlowLayout from '@/app/scan/_layout';
import NewProductScreen from '@/app/scan/new-product';
import { entriesForDate, getFood, myFoods } from '@/db/index';
import { migrate } from '@/db/schema';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import ro from '@/i18n/ro';
import { toDateKey } from '@/lib/date';
import { useLogStore } from '@/stores/log';

let mockDb: TestDb;
let mockUuid = 0;

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

const Home = () => <Text>home</Text>;
const Scanner = () => <Text>scanner</Text>;
const Search = () => <Text>search</Text>;

const routes = {
  '(tabs)/index': Home,
  'add/index': Search,
  'scan/_layout': ScanFlowLayout,
  'scan/index': Scanner,
  'scan/new-product': NewProductScreen,
};

const open = async (params: Record<string, string>) => {
  await renderRouter(routes, { initialUrl: '/' });
  await act(async () => router.push('/scan'));
  await act(async () => router.push({ pathname: '/scan/new-product', params }));
};

const type = async (field: string, text: string) =>
  fireEvent.changeText(screen.getByTestId(`product-${field}`), text);

const fillGranola = async () => {
  await type('name', 'Granola cu ovăz și miere');
  await type('servingGrams', '40');
  await type('kcal', '452');
  await type('protein', '8,5');
  await type('carbs', '63');
  await type('fat', '17');
};

beforeEach(async () => {
  mockUuid = 0;
  mockDb = createTestDb();
  await migrate(mockDb);
  useLogStore.setState({ date: toDateKey(new Date()), entries: [], loaded: false, revision: 0 });
});

afterEach(() => mockDb.close());

describe('Add product from label', () => {
  it('saves a custom food with the barcode, logs one serving and goes Home', async () => {
    await open({ barcode: '4000000000000', meal: 'lunch' });
    expect(screen.getByText(ro.addProduct.title)).toBeTruthy();
    expect(screen.getByTestId('product-subtitle')).toHaveTextContent(
      'Cod 4000000000000 · valori la 100 g',
    );
    expect(screen.getByTestId('product-save')).toBeDisabled();

    await fillGranola();
    expect(screen.getByTestId('product-save')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('product-save'));

    expect(screen).toHavePathname('/');
    const foods = await myFoods(mockDb);
    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({
      name: 'Granola cu ovăz și miere',
      barcode: '4000000000000',
      source: 'custom',
      servingGrams: 40,
      per100g: { kcal: 452, protein: 8.5, carbs: 63, fat: 17 },
    });
    expect(foods[0].id.startsWith('off:')).toBe(false);
    const entries = await entriesForDate(mockDb, toDateKey(new Date()));
    expect(entries).toEqual([
      expect.objectContaining({ meal: 'lunch', foodId: foods[0].id, grams: 40 }),
    ]);
  });

  it('logs 100 g without a serving and works without a barcode', async () => {
    await open({ meal: 'snack' });
    expect(screen.getByTestId('product-subtitle')).toHaveTextContent('Valori la 100 g');
    await type('name', 'Humus de casă');
    await type('kcal', '166');
    await fireEvent.press(screen.getByTestId('product-save'));

    const food = await getFood(mockDb, 'uuid-1');
    expect(food).toMatchObject({ source: 'custom' });
    expect(food).not.toHaveProperty('barcode');
    const entries = await entriesForDate(mockDb, toDateKey(new Date()));
    expect(entries[0]).toMatchObject({ meal: 'snack', grams: 100 });
  });

  it('shows a calm hint for out-of-range kcal and keeps the button disabled', async () => {
    await open({});
    await fillGranola();
    await type('kcal', '1200');
    expect(screen.getByText(ro.addProduct.errors.kcal)).toBeTruthy();
    expect(screen.getByTestId('product-save')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('product-save'));
    expect(await myFoods(mockDb)).toHaveLength(0);
  });

  it('hints when kcal does not match the macros but still allows saving', async () => {
    await open({});
    await fillGranola();
    await type('kcal', '200');
    expect(screen.getByTestId('product-kcal-hint')).toHaveTextContent(/aprox\. 439 kcal/);
    expect(screen.getByTestId('product-save')).toBeEnabled();
  });

  it('flags macros over 100 g per 100 g', async () => {
    await open({});
    await fillGranola();
    await type('carbs', '80');
    expect(screen.getByTestId('product-macro-sum')).toBeTruthy();
    expect(screen.getByTestId('product-save')).toBeDisabled();
  });

  it('opened from search, back returns to search', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await act(async () => router.push('/add'));
    await act(async () => router.push({ pathname: '/scan/new-product', params: { meal: 'dinner' } }));
    expect(screen).toHavePathname('/scan/new-product');
    await fireEvent.press(screen.getByTestId('log-back'));
    expect(screen).toHavePathname('/add');
  });
});
