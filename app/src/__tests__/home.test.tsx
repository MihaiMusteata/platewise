import { renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import HomeScreen from '@/app/(tabs)/index';
import { useProfileStore } from '@/stores/profile';
import type { UserProfile } from '@/types/models';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
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
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': HomeScreen,
  '(tabs)/progress': () => null,
  'onboarding/about': () => null,
};

describe('HomeScreen', () => {
  beforeEach(() => useProfileStore.getState().reset());

  it('redirects to onboarding on first launch', async () => {
    await renderRouter(routes);
    expect(screen).toHavePathname('/onboarding/about');
  });

  it('guards every tab, not only Home', async () => {
    await renderRouter(routes, { initialUrl: '/progress' });
    expect(screen).toHavePathname('/onboarding/about');
  });

  it('shows home once onboarded', async () => {
    useProfileStore.getState().completeOnboarding(profile);
    await renderRouter(routes);
    expect(screen).toHavePathname('/');
    expect(screen.getByText('Platewise')).toBeTruthy();
  });
});
