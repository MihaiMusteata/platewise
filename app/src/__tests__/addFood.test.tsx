import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import LogFoodScreen from '@/app/add/food/[id]';
import AddFoodScreen from '@/app/add/index';
import { getFood } from '@/db/foodsRepo';
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import ro from '@/i18n/ro';
import { toDateKey } from '@/lib/date';
import { useLogStore } from '@/stores/log';
import type { Food } from '@/types/models';

let mockDb: TestDb;
let mockUuid = 0;
const mockSearch = jest.fn();

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock('@/db/index', () => ({
  ...jest.requireActual('@/db/logRepo'),
  ...jest.requireActual('@/db/foodsRepo'),
  COMMON_FOODS: jest.requireActual('@/db/seed').COMMON_FOODS,
  getDb: async () => mockDb,
}));
jest.mock('@/services/foodApi', () => ({
  openFoodFactsApi: {
    search: (...args: unknown[]) => mockSearch(...args),
    lookupBarcode: async () => ({ status: 'offline' }),
  },
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

const routes = {
  'add/index': AddFoodScreen,
  'add/food/[id]': LogFoodScreen,
  'scan/index': () => null,
};

const ONLINE_WAIT = { timeout: 2000 };

beforeEach(async () => {
  mockUuid = 0;
  mockSearch.mockReset();
  mockSearch.mockResolvedValue({ status: 'ok', foods: [] });
  mockDb = createTestDb();
  await migrate(mockDb);
  await seedCommonFoods(mockDb);
  useLogStore.setState({ date: toDateKey(new Date()), entries: [], loaded: false, revision: 0 });
});

afterEach(() => mockDb.close());

const type = (text: string) => fireEvent.changeText(screen.getByTestId('add-search'), text);

describe('Add food search', () => {
  it('shows the meal from the route and suggestions before anything was logged', async () => {
    await renderRouter(routes, { initialUrl: '/add?meal=dinner' });
    expect(screen.getByTestId('add-meal')).toHaveTextContent(`${ro.addFood.addingTo} ${ro.meals.dinner}`);
    expect(await screen.findByText(ro.addFood.sections.suggestions)).toBeTruthy();
  });

  it('lists recent foods first when the query is empty', async () => {
    await useLogStore.getState().add({ meal: 'lunch', foodId: 'common:banana', grams: 120 });
    await renderRouter(routes, { initialUrl: '/add' });
    expect(await screen.findByTestId('result-common:banana')).toBeTruthy();
    expect(screen.getAllByText(ro.addFood.sections.recent)).toHaveLength(2); // chip + section
  });

  it('finds seeded foods while typing, ignoring diacritics', async () => {
    await renderRouter(routes, { initialUrl: '/add' });
    await type('branza');
    expect(await screen.findByText('Brânză telemea')).toBeTruthy();
    expect(screen.getByText('Brânză de vaci')).toBeTruthy();
    expect(screen.getByText(ro.addFood.sections.results)).toBeTruthy();
  });

  it('opens Log food with the meal when a result is pressed', async () => {
    await renderRouter(routes, { initialUrl: '/add?meal=snack' });
    await type('telemea');
    await fireEvent.press(await screen.findByTestId('result-common:branza-telemea'));
    expect(screen).toHavePathname('/add/food/common:branza-telemea');
    expect(screen).toHaveSearchParams({ id: 'common:branza-telemea', meal: 'snack' });
  });

  it('quick adds one serving to the current meal, with undo', async () => {
    await renderRouter(routes, { initialUrl: '/add?meal=breakfast' });
    await type('fulgi');
    await fireEvent.press(await screen.findByTestId('result-common:fulgi-de-ovaz-add'));
    await waitFor(() => expect(useLogStore.getState().entries).toHaveLength(1));
    expect(useLogStore.getState().entries[0]).toMatchObject({
      meal: 'breakfast',
      foodId: 'common:fulgi-de-ovaz',
      grams: 40,
    });
    expect(screen.getByTestId('add-snackbar')).toHaveTextContent(/Adăugat: Fulgi de ovăz/);
    expect(screen.getByLabelText(ro.addFood.addedLabel('Fulgi de ovăz'))).toBeTruthy();

    await fireEvent.press(screen.getByText(ro.common.undo));
    await waitFor(() => expect(useLogStore.getState().entries).toHaveLength(0));
  });

  it('adds Open Food Facts results in their own section and caches one when opened', async () => {
    mockSearch.mockResolvedValue({ status: 'ok', foods: [nutella] });
    await renderRouter(routes, { initialUrl: '/add' });
    await type('nutella');
    expect(await screen.findByTestId(`online-${nutella.id}`, {}, ONLINE_WAIT)).toBeTruthy();
    expect(mockSearch).toHaveBeenCalledWith('nutella');
    expect(screen.getByText(ro.addFood.sections.online)).toBeTruthy();
    expect(screen.getByTestId('add-attribution')).toHaveTextContent(ro.addFood.attribution);
    expect(screen.getByText('Ferrero · 15 g · 81 kcal')).toBeTruthy();

    await fireEvent.press(screen.getByTestId(`online-${nutella.id}`));
    expect(screen).toHavePathname(`/add/food/${nutella.id}`);
    expect(await getFood(mockDb, nutella.id)).toMatchObject({ name: 'Nutella', source: 'off' });
  });

  it('caches an Open Food Facts result before quick adding it', async () => {
    mockSearch.mockResolvedValue({ status: 'ok', foods: [nutella] });
    await renderRouter(routes, { initialUrl: '/add?meal=snack' });
    await type('nutella');
    await fireEvent.press(await screen.findByTestId(`online-${nutella.id}-add`, {}, ONLINE_WAIT));
    await waitFor(() => expect(useLogStore.getState().entries).toHaveLength(1));
    expect(useLogStore.getState().entries[0]).toMatchObject({ foodId: nutella.id, grams: 15 });
  });

  it('does not repeat an online result that is already cached locally', async () => {
    const { upsertFood } = jest.requireActual('@/db/foodsRepo');
    await upsertFood(mockDb, nutella);
    mockSearch.mockResolvedValue({ status: 'ok', foods: [nutella] });
    await renderRouter(routes, { initialUrl: '/add' });
    await type('nutella');
    expect(await screen.findByTestId(`result-${nutella.id}`)).toBeTruthy();
    await waitFor(() => expect(mockSearch).toHaveBeenCalled(), ONLINE_WAIT);
    await waitFor(() => expect(screen.queryByText(ro.addFood.searchingOnline)).toBeNull());
    expect(screen.queryByTestId(`online-${nutella.id}`)).toBeNull();
  });

  it('keeps local results and shows a calm note when offline', async () => {
    mockSearch.mockResolvedValue({ status: 'offline' });
    await renderRouter(routes, { initialUrl: '/add' });
    await type('branza');
    expect(await screen.findByTestId('add-online-note', {}, ONLINE_WAIT)).toHaveTextContent(
      ro.addFood.offline,
    );
    expect(screen.getByText('Brânză telemea')).toBeTruthy();
  });

  it('does not claim "nothing found" when only the online search failed', async () => {
    mockSearch.mockResolvedValue({ status: 'offline' });
    await renderRouter(routes, { initialUrl: '/add' });
    await type('nutella');
    expect(await screen.findByTestId('add-online-note', {}, ONLINE_WAIT)).toBeTruthy();
    expect(screen.queryByTestId('add-empty')).toBeNull();
  });

  it('shows the error note when the online search fails', async () => {
    mockSearch.mockRejectedValue(new Error('boom'));
    await renderRouter(routes, { initialUrl: '/add' });
    await type('branza');
    expect(await screen.findByTestId('add-online-note', {}, ONLINE_WAIT)).toHaveTextContent(
      ro.addFood.onlineError,
    );
  });

  it('filters by chip without going online', async () => {
    await renderRouter(routes, { initialUrl: '/add' });
    await fireEvent.press(screen.getByTestId('filter-mine'));
    expect(await screen.findByText(ro.addFood.emptyMine)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('filter-recent'));
    expect(await screen.findByText(ro.addFood.emptyRecent)).toBeTruthy();
    await type('branza');
    expect(await screen.findByText(ro.addFood.noResults('branza'))).toBeTruthy();
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('opens the scanner from the search row', async () => {
    await renderRouter(routes, { initialUrl: '/add' });
    await fireEvent.press(screen.getByTestId('add-scan'));
    expect(screen).toHavePathname('/scan');
  });
});
