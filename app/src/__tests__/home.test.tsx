import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import HomeScreen from '@/app/(tabs)/index';
import { migrate } from '@/db/schema';
import { seedCommonFoods } from '@/db/seed';
import { createTestDb, type TestDb } from '@/db/testing/testDb';
import { toDateKey } from '@/lib/date';
import { defaultMealFor } from '@/lib/meals';
import { useLogStore } from '@/stores/log';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme';
import type { Meal, UserProfile } from '@/types/models';

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
  '(tabs)/index': HomeScreen,
  '(tabs)/progress': () => null,
  '(tabs)/settings': () => null,
  add: () => null,
  'scan/index': () => null,
  'onboarding/about': () => null,
};

const log = (meal: Meal, foodId: string, grams: number) =>
  useLogStore.getState().add({ meal, foodId, grams });

beforeEach(async () => {
  mockUuid = 0;
  mockDb = createTestDb();
  await migrate(mockDb);
  await seedCommonFoods(mockDb);
  useLogStore.setState({ date: toDateKey(new Date()), entries: [], loaded: false, revision: 0 });
  useProfileStore.getState().reset();
});

afterEach(() => mockDb.close());

describe('HomeScreen', () => {
  it('redirects to onboarding on first launch', async () => {
    await renderRouter(routes);
    expect(screen).toHavePathname('/onboarding/about');
  });

  it('guards every tab, not only Home', async () => {
    await renderRouter(routes, { initialUrl: '/progress' });
    expect(screen).toHavePathname('/onboarding/about');
  });

  it('shows totals, remaining, macros and meals from the log', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await log('breakfast', 'common:ou-fiert', 100); // 155 kcal
    await log('breakfast', 'common:iaurt-grecesc', 150); // 193,5 kcal
    await log('lunch', 'common:piept-de-pui', 150); // 247,5 kcal
    await log('lunch', 'common:orez-fiert', 150); // 195 kcal

    await renderRouter(routes);
    expect(screen).toHavePathname('/');

    expect(await screen.findByText('791')).toBeTruthy();
    expect(screen.getByText('/ 1.900 kcal')).toBeTruthy();
    expect(screen.getByTestId('home-remaining')).toHaveTextContent('1.109 kcal rămase');
    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.getByLabelText('Mic dejun, Ou fiert, Iaurt grecesc, 349 kcal')).toBeTruthy();
    expect(screen.getByLabelText('Prânz, Piept de pui la grătar, Orez fiert, 443 kcal')).toBeTruthy();
    expect(screen.getByLabelText('Cină, Nimic adăugat încă, 0 kcal')).toBeTruthy();
    // Protein: 12,6 + 8,1 + 46,5 + 4,05 ≈ 71 g of 143 g (30 % of 1.900 / 4).
    expect(screen.getByLabelText('Proteine: 71 g / 143 g, 50%')).toBeTruthy();
  });

  it('shows kcal over the target in neutral wording, without warning colors', async () => {
    useProfileStore.getState().completeOnboarding({ ...profile, dailyTargetKcal: 1200 });
    await log('dinner', 'common:piept-de-pui', 500); // 825 kcal
    await log('dinner', 'common:orez-fiert', 400); // 520 kcal

    await renderRouter(routes);
    const remaining = await screen.findByText('145 kcal peste țintă');
    expect(remaining).toHaveStyle({ color: colors.heroTextSecondary });
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('hides target and remaining while tracking is paused', async () => {
    useProfileStore.getState().completeOnboarding({ ...profile, paused: true });
    await log('snack', 'common:ou-fiert', 100);

    await renderRouter(routes);
    expect(await screen.findByTestId('home-paused')).toBeTruthy();
    expect(screen.queryByTestId('home-food-kcal')).toBeNull();
    expect(screen.queryByTestId('home-remaining')).toBeNull();
    expect(screen.queryByText('/ 1.900 kcal')).toBeNull();
    expect(screen.getByLabelText('Proteine: 13 g')).toBeTruthy();
    // Logging stays available.
    expect(screen.getByTestId('home-add')).toBeTruthy();
  });

  it('opens Add food with the meal of the tapped row', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await log('snack', 'common:ou-fiert', 100);
    await renderRouter(routes);
    await fireEvent.press(await screen.findByTestId('home-meal-lunch'));
    expect(screen).toHavePathname('/add');
    expect(screen).toHaveSearchParams({ meal: 'lunch' });
  });

  it('opens Add food for the meal of the time of day from the floating button', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await log('snack', 'common:ou-fiert', 100);
    await renderRouter(routes);
    await fireEvent.press(await screen.findByTestId('home-add'));
    expect(screen).toHavePathname('/add');
    expect(screen).toHaveSearchParams({ meal: defaultMealFor(new Date()) });
  });

  describe('empty day', () => {
    it('shows the new-day hero and empty meal rows when nothing is logged', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      await renderRouter(routes);

      expect(await screen.findByTestId('home-empty')).toBeTruthy();
      expect(screen.getByText('O zi nouă')).toBeTruthy();
      expect(screen.getByText('1.900')).toBeTruthy();
      expect(screen.getByText('kcal rămase')).toBeTruthy();
      expect(screen.getByText('Scanează sau caută primul aliment.')).toBeTruthy();
      expect(screen.getAllByText('Nimic adăugat încă')).toHaveLength(4);
      expect(screen.getByLabelText('Adaugă la Cină')).toBeTruthy();
      // No macro cards and no floating button on an empty day.
      expect(screen.queryByLabelText(/^Proteine/)).toBeNull();
      expect(screen.queryByTestId('home-add')).toBeNull();
    });

    it('opens Add food for the meal of an empty row', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      await renderRouter(routes);

      await fireEvent.press(await screen.findByTestId('home-add-dinner'));
      expect(screen).toHavePathname('/add');
      expect(screen).toHaveSearchParams({ meal: 'dinner' });
    });

    it('opens the scanner from the hero', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      await renderRouter(routes);
      await fireEvent.press(await screen.findByTestId('home-scan'));
      expect(screen).toHavePathname('/scan');
    });

    it('opens search for the meal of the time of day from the hero', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      await renderRouter(routes);
      await fireEvent.press(await screen.findByTestId('home-search'));
      expect(screen).toHavePathname('/add');
      expect(screen).toHaveSearchParams({ meal: defaultMealFor(new Date()) });
    });
  });

  describe('delete with undo', () => {
    const deleteViaVoiceOver = async (id: string) => {
      await fireEvent(screen.getByTestId(`home-entry-${id}`), 'accessibilityAction', {
        nativeEvent: { actionName: 'delete' },
      });
    };

    it('lists entries under their meal with grams and kcal', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      await log('breakfast', 'common:ou-fiert', 100);
      await renderRouter(routes);
      expect(await screen.findByLabelText('Ou fiert, 100 g, 155 kcal')).toBeTruthy();
      expect(screen.getByLabelText('Șterge Ou fiert')).toBeTruthy();
    });

    it('deletes an entry and shows the undo snackbar', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      const egg = await log('breakfast', 'common:ou-fiert', 100);
      await log('lunch', 'common:orez-fiert', 150);
      const original = useLogStore.getState().remove;
      const remove = jest.fn(original);
      useLogStore.setState({ remove });
      await renderRouter(routes);
      await screen.findByTestId(`home-entry-${egg.id}`);

      await deleteViaVoiceOver(egg.id);

      expect(remove).toHaveBeenCalledWith(egg.id);
      expect(await screen.findByText('Șters: Ou fiert')).toBeTruthy();
      expect(screen.queryByTestId(`home-entry-${egg.id}`)).toBeNull();
      expect(screen.getByTestId('home-food-kcal')).toHaveTextContent('195');
      useLogStore.setState({ remove: original });
    });

    it('restores the entry on "Anulează"', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      const egg = await log('breakfast', 'common:ou-fiert', 100);
      await renderRouter(routes);
      await screen.findByTestId(`home-entry-${egg.id}`);

      await deleteViaVoiceOver(egg.id);
      // Last entry gone: the empty day shows, with the snackbar still on top.
      expect(await screen.findByTestId('home-empty')).toBeTruthy();
      await fireEvent.press(screen.getByLabelText('Anulează'));

      expect(await screen.findByTestId(`home-entry-${egg.id}`)).toBeTruthy();
      expect(screen.queryByTestId('home-snackbar')).toBeNull();
      expect(useLogStore.getState().entries.map((e) => e.id)).toEqual([egg.id]);
    });

    it('keeps one snackbar: a second delete replaces the first, which stays deleted', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      const egg = await log('breakfast', 'common:ou-fiert', 100);
      const rice = await log('lunch', 'common:orez-fiert', 150);
      await renderRouter(routes);
      await screen.findByTestId(`home-entry-${egg.id}`);

      await deleteViaVoiceOver(egg.id);
      await screen.findByText('Șters: Ou fiert');
      await deleteViaVoiceOver(rice.id);

      expect(await screen.findByText('Șters: Orez fiert')).toBeTruthy();
      expect(screen.queryByText('Șters: Ou fiert')).toBeNull();
      expect(screen.getAllByTestId('home-snackbar')).toHaveLength(1);

      await fireEvent.press(screen.getByLabelText('Anulează'));
      expect(await screen.findByTestId(`home-entry-${rice.id}`)).toBeTruthy();
      expect(screen.queryByTestId(`home-entry-${egg.id}`)).toBeNull();
    });

    it('hides the snackbar after 5 s', async () => {
      useProfileStore.getState().completeOnboarding(profile);
      const egg = await log('breakfast', 'common:ou-fiert', 100);
      await log('lunch', 'common:orez-fiert', 150);
      await renderRouter(routes);
      await screen.findByTestId(`home-entry-${egg.id}`);

      jest.useFakeTimers();
      try {
        await deleteViaVoiceOver(egg.id);
        expect(await screen.findByTestId('home-snackbar')).toBeTruthy();
        await act(async () => {
          jest.advanceTimersByTime(5000);
        });
        expect(screen.queryByTestId('home-snackbar')).toBeNull();
        expect(screen.getByTestId('home-add')).toBeTruthy();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
