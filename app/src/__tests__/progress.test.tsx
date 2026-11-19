import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import ProgressScreen from '@/app/(tabs)/progress';
import { addEntry } from '@/db/logRepo';
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import { useLogStore } from '@/stores/log';
import { useProfileStore } from '@/stores/profile';
import type { UserProfile } from '@/types/models';

let mockDb: TestDb;
let mockUuid = 0;

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock('@/db/index', () => {
  const actual = jest.requireActual('@/db/logRepo');
  return { ...actual, getDb: async () => mockDb };
});

// Thursday 19 November 2026; the week runs Mon 16 – Sun 22.
const NOW = new Date(2026, 10, 19, 12, 0, 0);

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
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': () => null,
  '(tabs)/progress': ProgressScreen,
  '(tabs)/plans': () => null,
  '(tabs)/settings': () => null,
  add: () => null,
  'onboarding/about': () => null,
};

const log = (date: string, foodId: string, grams: number) =>
  addEntry(mockDb, { date, meal: 'lunch', foodId: `common:${foodId}`, grams });

/** A few days: this week (Tue 330, Thu 440), earlier this month (650), March (1.395). */
async function seedLog() {
  await log('2026-11-19', 'ou-fiert', 200); // 310
  await log('2026-11-19', 'orez-fiert', 100); // 130
  await log('2026-11-17', 'piept-de-pui', 200); // 330
  await log('2026-11-03', 'orez-fiert', 500); // 650
  await log('2026-03-10', 'ou-fiert', 900); // 1.395
}

const layoutChart = () =>
  act(() =>
    fireEvent(screen.getByTestId('calorie-chart'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 280, height: 120 } },
    }),
  );

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  mockUuid = 0;
  mockDb = createTestDb();
  await migrate(mockDb);
  await seedCommonFoods(mockDb);
  useLogStore.setState({ date: '2026-11-19', entries: [], loaded: false, revision: 0 });
  useProfileStore.getState().reset();
});

afterEach(() => {
  mockDb.close();
  jest.useRealTimers();
});

describe('ProgressScreen', () => {
  it('shows the week: average of logged days, weekly goal and macro share', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await seedLog();
    await renderRouter(routes, { initialUrl: '/progress' });

    expect(await screen.findByText('385 kcal')).toBeTruthy(); // (440 + 330) / 2
    expect(screen.getByTestId('progress-weekly-value')).toHaveTextContent('770 / 13.300 kcal');
    expect(screen.getByTestId('progress-weekly-percent')).toHaveTextContent('6%');
    expect(screen.getByTestId('donut-average')).toHaveTextContent('385');
    expect(screen.getByTestId('legend-protein')).toHaveTextContent('49%');
    expect(screen.getByTestId('legend-carbs')).toHaveTextContent('16%');
    expect(screen.getByTestId('legend-fat')).toHaveTextContent('35%');
    expect(screen.getByLabelText(/Calorii pe zi: Lu 0, Ma 330, Mi 0, Jo 440/)).toBeTruthy();
  });

  it('shows today in the tooltip and the tapped bar after a tap', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await seedLog();
    await renderRouter(routes, { initialUrl: '/progress' });
    await screen.findByText('385 kcal');
    await layoutChart();

    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('440 kcal');
    expect(screen.getByTestId('chart-goal-line')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('chart-bar-2026-11-17'));
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('330 kcal');
  });

  it('switches to month and year; the weekly goal stays on the current week', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await seedLog();
    await renderRouter(routes, { initialUrl: '/progress' });
    await screen.findByText('385 kcal');

    await fireEvent.press(screen.getByTestId('segment-month'));
    expect(await screen.findByText('473 kcal')).toBeTruthy(); // (440 + 330 + 650) / 3
    expect(screen.getByTestId('progress-weekly-value')).toHaveTextContent('770 / 13.300 kcal');

    await fireEvent.press(screen.getByTestId('segment-year'));
    expect(await screen.findByText('704 kcal')).toBeTruthy(); // 2.815 / 4 logged days
    await layoutChart();
    // Year bars are month averages; November is the current month.
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('473 kcal');
    expect(screen.getByTestId('progress-weekly-value')).toHaveTextContent('770 / 13.300 kcal');
  });

  it('refreshes when the log changes', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await seedLog();
    await renderRouter(routes, { initialUrl: '/progress' });
    await screen.findByText('385 kcal');

    await act(() => useLogStore.getState().add({ meal: 'dinner', foodId: 'common:orez-fiert', grams: 100 }));
    expect(await screen.findByText('450 kcal')).toBeTruthy(); // (570 + 330) / 2
  });

  it('shows a calm empty state with no entries', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await renderRouter(routes, { initialUrl: '/progress' });

    expect(await screen.findByTestId('macros-empty')).toBeTruthy();
    expect(screen.getByText('0 kcal')).toBeTruthy();
    expect(screen.getByTestId('progress-weekly-value')).toHaveTextContent('0 / 13.300 kcal');
    expect(screen.queryByTestId('legend-protein')).toBeNull();
  });

  it('shows the weight-off card linking to Settings', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await renderRouter(routes, { initialUrl: '/progress' });

    expect(await screen.findByText('Greutatea nu e urmărită')).toBeTruthy();
    expect(screen.getByText('Pentru mulți, caloriile ajung. O poți porni din Setări.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('progress-weight'));
    expect(screen).toHavePathname('/settings');
  });

  it('shows the profile weight when weight tracking is on', async () => {
    useProfileStore.getState().completeOnboarding({ ...profile, weightTracking: true, weightKg: 72.4 });
    await renderRouter(routes, { initialUrl: '/progress' });
    expect(await screen.findByText('Greutatea ta: 72,4 kg')).toBeTruthy();
  });

  it('hides the goal line and weekly numbers while paused', async () => {
    useProfileStore.getState().completeOnboarding({ ...profile, paused: true });
    await seedLog();
    await renderRouter(routes, { initialUrl: '/progress' });
    await screen.findByText('385 kcal');
    await layoutChart();

    expect(screen.getByTestId('progress-paused')).toBeTruthy();
    expect(screen.queryByTestId('progress-weekly')).toBeNull();
    expect(screen.queryByTestId('chart-goal-line')).toBeNull();
  });
});
