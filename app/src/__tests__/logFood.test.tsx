import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import AddFlowLayout from '@/app/add/_layout';
import LogFoodScreen from '@/app/add/food/[id]';
import { entriesForDate, upsertFood } from '@/db/index';
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import ro from '@/i18n/ro';
import { toDateKey } from '@/lib/date';
import { useLogStore } from '@/stores/log';
import type { Food } from '@/types/models';

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

const nutella: Food = {
  id: 'off:3017620422003',
  name: 'Nutella',
  brand: 'Ferrero',
  barcode: '3017620422003',
  per100g: { kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
  servingName: 'porție',
  servingGrams: 15,
  source: 'off',
};

const plain: Food = {
  id: 'custom-1',
  name: 'Salată de casă',
  per100g: { kcal: 80, protein: 2, carbs: 6, fat: 5 },
  source: 'custom',
};

const Home = () => <Text>home</Text>;
const AddIndex = () => <Text>search</Text>;

const routes = {
  '(tabs)/index': Home,
  'add/_layout': AddFlowLayout,
  'add/index': AddIndex,
  'add/food/[id]': LogFoodScreen,
};

beforeEach(async () => {
  mockUuid = 0;
  mockDb = createTestDb();
  await migrate(mockDb);
  await seedCommonFoods(mockDb);
  useLogStore.setState({ date: toDateKey(new Date()), entries: [], loaded: false, revision: 0 });
});

afterEach(() => mockDb.close());

const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));

describe('Log food', () => {
  it('logs the chosen amount and meal, then closes the add flow back to Home', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await act(async () => router.push('/add'));
    await act(async () =>
      router.push({ pathname: '/add/food/[id]', params: { id: 'common:ou-fiert', meal: 'lunch' } }),
    );

    // Ou fiert: 155 kcal / 100 g, 1 bucată = 50 g → starts at one serving.
    expect(await screen.findByTestId('log-name')).toHaveTextContent('Ou fiert');
    expect(screen.getByTestId('log-subtitle')).toHaveTextContent('1 bucată = 50 g · Alimente comune');
    expect(screen.getByTestId('log-kcal')).toHaveTextContent('78');
    expect(screen.getByText('kcal pentru 1 bucată')).toBeTruthy();
    expect(screen.getByTestId('log-meal-lunch')).toBeSelected();
    expect(screen.queryByTestId('log-attribution')).toBeNull();

    await fireEvent.press(screen.getByLabelText(ro.common.more));
    expect(screen.getByTestId('log-kcal')).toHaveTextContent('116'); // 1,5 × 50 g = 75 g
    expect(screen.getByText('kcal pentru 1,5 bucăți')).toBeTruthy();

    await fireEvent.press(screen.getByRole('tab', { name: ro.logFood.grams }));
    expect(screen.getByText('kcal pentru 75 g')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(ro.common.more));
    expect(screen.getByTestId('log-kcal')).toHaveTextContent('132'); // 85 g
    expect(screen.getByTestId('log-macro-protein')).toHaveTextContent(`${ro.macros.protein}10,7 g`);

    await press('log-meal-dinner');
    expect(screen.getByTestId('log-save')).toHaveTextContent(
      ro.logFood.save(ro.meals.dinner, '132'),
    );
    await press('log-save');

    expect(await screen.findByText('home')).toBeTruthy();
    expect(screen).toHavePathname('/');
    const entries = await entriesForDate(mockDb, toDateKey(new Date()));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ foodId: 'common:ou-fiert', meal: 'dinner', grams: 85 });
    expect(useLogStore.getState().entries).toHaveLength(1);
  });

  it('opens Open Food Facts ids with a colon and shows the attribution', async () => {
    await upsertFood(mockDb, nutella);
    await renderRouter(routes, { initialUrl: `/add/food/${nutella.id}?meal=snack` });
    expect(await screen.findByTestId('log-name')).toHaveTextContent('Nutella');
    expect(screen.getByTestId('log-subtitle')).toHaveTextContent(
      'Ferrero · 1 porție = 15 g · Open Food Facts',
    );
    expect(screen.getByTestId('log-attribution')).toHaveTextContent(ro.addFood.attribution);
    expect(screen.getByTestId('log-meal-snack')).toBeSelected();
    expect(screen.getByTestId('log-kcal')).toHaveTextContent('81');
  });

  it('works in grams only when the food has no serving size', async () => {
    await upsertFood(mockDb, plain);
    await renderRouter(routes, { initialUrl: '/add/food/custom-1' });
    expect(await screen.findByTestId('log-name')).toHaveTextContent(plain.name);
    expect(screen.queryByRole('tab', { name: ro.logFood.servings })).toBeNull();
    expect(screen.getByText('kcal pentru 100 g')).toBeTruthy();
    expect(screen.getByTestId('log-kcal')).toHaveTextContent('80');
    await fireEvent.press(screen.getByLabelText(ro.common.less));
    expect(screen.getByTestId('log-kcal')).toHaveTextContent('72'); // 90 g
  });

  it('shows a calm note when the food does not exist', async () => {
    await renderRouter(routes, { initialUrl: '/add/food/common:nu-exista' });
    expect(await screen.findByTestId('log-not-found')).toHaveTextContent(ro.logFood.notFoundTitle, {
      exact: false,
    });
  });
});
