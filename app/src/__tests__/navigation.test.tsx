import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import TabsLayout from '@/app/(tabs)/_layout';
import HomeScreen from '@/app/(tabs)/index';
import PlansScreen from '@/app/(tabs)/plans';
import ProgressScreen from '@/app/(tabs)/progress';
import SettingsScreen from '@/app/(tabs)/settings';
import AddFlowLayout from '@/app/add/_layout';
import LogFoodScreen from '@/app/add/food/[id]';
import AddFoodScreen from '@/app/add/index';
import ScanFlowLayout from '@/app/scan/_layout';
import ScanScreen from '@/app/scan/index';
import NewProductScreen from '@/app/scan/new-product';
import ScanNotFoundScreen from '@/app/scan/not-found';
import ProductFoundScreen from '@/app/scan/product/[barcode]';
import ro from '@/i18n/ro';
import { useProfileStore } from '@/stores/profile';
import type { UserProfile } from '@/types/models';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
}));

// Home and Add food read the database; serve them from an in-memory one instead of native SQLite.
jest.mock('@/db/index', () => {
  const actual = {
    ...jest.requireActual('@/db/logRepo'),
    ...jest.requireActual('@/db/foodsRepo'),
    COMMON_FOODS: jest.requireActual('@/db/seed').COMMON_FOODS,
  };
  const { createTestDb } = jest.requireActual('@/db/testing/testDb');
  const { migrate } = jest.requireActual('@/db/schema');
  let db: Promise<unknown> | undefined;
  const getDb = () => {
    db ??= (async () => {
      const created = createTestDb();
      await migrate(created);
      return created;
    })();
    return db;
  };
  return { ...actual, getDb };
});

// Add food would search Open Food Facts; keep tests off the network.
jest.mock('@/services/foodApi', () => ({
  openFoodFactsApi: {
    search: async () => ({ status: 'ok', foods: [] }),
    lookupBarcode: async () => ({ status: 'offline' }),
  },
}));

jest.mock('@expo-google-fonts/plus-jakarta-sans', () => ({
  useFonts: () => [true, null],
}));

const profile: UserProfile = {
  isAdult: true,
  age: 30,
  heightCm: 165,
  weightKg: 65,
  sex: 'female',
  activity: 'light',
  goal: 'maintain',
  dailyTargetKcal: 1900,
  weightTracking: false,
  mealReminders: false,
  paused: false,
};

const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': HomeScreen,
  '(tabs)/progress': ProgressScreen,
  '(tabs)/plans': PlansScreen,
  '(tabs)/settings': SettingsScreen,
  'add/_layout': AddFlowLayout,
  'add/index': AddFoodScreen,
  'add/food/[id]': LogFoodScreen,
  'scan/_layout': ScanFlowLayout,
  'scan/index': ScanScreen,
  'scan/not-found': ScanNotFoundScreen,
  'scan/product/[barcode]': ProductFoundScreen,
  'scan/new-product': NewProductScreen,
  'onboarding/about': () => null,
};

describe('navigation shell', () => {
  beforeEach(() => {
    useProfileStore.getState().reset();
    useProfileStore.getState().completeOnboarding(profile);
  });

  it('renders the four tab labels and the Log button', async () => {
    await renderRouter(routes);
    for (const label of [ro.tabs.home, ro.tabs.progress, ro.tabs.plans, ro.tabs.settings]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByTestId('tab-log').props.accessibilityLabel).toBe(ro.tabs.log);
    expect(screen.getByTestId('tab-index').props.accessibilityState).toEqual({ selected: true });
  });

  it('switches tabs and marks the active one', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByTestId('tab-progress'));
    expect(screen).toHavePathname('/progress');
    expect(screen.getByTestId('tab-progress').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('tab-index').props.accessibilityState).toEqual({ selected: false });

    await fireEvent.press(screen.getByTestId('tab-plans'));
    expect(screen).toHavePathname('/plans');
    expect(screen.getByText(ro.placeholder.plansBody)).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-settings'));
    expect(screen).toHavePathname('/settings');

    await fireEvent.press(screen.getByTestId('tab-index'));
    expect(screen).toHavePathname('/');
  });

  it('opens Add food from the Log button and closes it', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByTestId('tab-log'));
    expect(screen).toHavePathname('/add');
    await fireEvent.press(screen.getByTestId('add-done'));
    expect(screen).toHavePathname('/');
  });

  it('reaches every scan-flow placeholder inside the scan modal', async () => {
    await renderRouter(routes, { initialUrl: '/add' });
    await fireEvent.press(screen.getByTestId('add-scan'));
    expect(screen).toHavePathname('/scan');
    await fireEvent.press(screen.getByTestId('link-product'));
    expect(screen).toHavePathname('/scan/product/5941234567890');
    await fireEvent.press(screen.getByTestId('placeholder-dismiss'));
    expect(screen).toHavePathname('/scan');
    await fireEvent.press(screen.getByTestId('link-not-found'));
    expect(screen).toHavePathname('/scan/not-found');
    await fireEvent.press(screen.getByTestId('link-new-product'));
    expect(screen).toHavePathname('/scan/new-product');
  });

  it('opens Log food inside the add modal with the meal', async () => {
    await renderRouter(routes, { initialUrl: '/add?meal=lunch' });
    await fireEvent.press(await screen.findByTestId('result-common:ou-fiert'));
    expect(screen).toHavePathname('/add/food/common:ou-fiert');
    expect(screen).toHaveSearchParams({ id: 'common:ou-fiert', meal: 'lunch' });
    expect(screen.getByText(ro.placeholder.food)).toBeTruthy();
  });
});
