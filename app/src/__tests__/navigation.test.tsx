import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import TabsLayout from '@/app/(tabs)/_layout';
import HomeScreen from '@/app/(tabs)/index';
import PlansScreen from '@/app/(tabs)/plans';
import ProgressScreen from '@/app/(tabs)/progress';
import SettingsScreen from '@/app/(tabs)/settings';
import AddFoodScreen from '@/app/add';
import LogFoodScreen from '@/app/food/[id]';
import ProductFoundScreen from '@/app/product/[barcode]';
import NewProductScreen from '@/app/product/new';
import ScanScreen from '@/app/scan';
import ScanNotFoundScreen from '@/app/scan/not-found';
import ro from '@/i18n/ro';
import { useProfileStore } from '@/stores/profile';
import type { UserProfile } from '@/types/models';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
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
  add: AddFoodScreen,
  'scan/index': ScanScreen,
  'scan/not-found': ScanNotFoundScreen,
  'product/[barcode]': ProductFoundScreen,
  'product/new': NewProductScreen,
  'food/[id]': LogFoodScreen,
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
    expect(screen.getByLabelText(ro.tabs.log)).toBeTruthy();
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
    await fireEvent.press(screen.getByTestId('placeholder-dismiss'));
    expect(screen).toHavePathname('/');
  });

  it('reaches every modal-flow placeholder', async () => {
    await renderRouter(routes, { initialUrl: '/add' });
    await fireEvent.press(screen.getByTestId('link-scan'));
    expect(screen).toHavePathname('/scan');
    await fireEvent.press(screen.getByTestId('link-product'));
    expect(screen).toHavePathname('/product/5941234567890');
    await fireEvent.press(screen.getByTestId('placeholder-dismiss'));
    expect(screen).toHavePathname('/scan');
    await fireEvent.press(screen.getByTestId('link-not-found'));
    expect(screen).toHavePathname('/scan/not-found');
    await fireEvent.press(screen.getByTestId('link-new-product'));
    expect(screen).toHavePathname('/product/new');
  });

  it('opens Log food from Add food', async () => {
    await renderRouter(routes, { initialUrl: '/add' });
    await fireEvent.press(screen.getByTestId('link-food'));
    expect(screen).toHavePathname('/food/common:sample');
    expect(screen.getByText(ro.placeholder.food)).toBeTruthy();
  });
});
