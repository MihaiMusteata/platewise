import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabsLayout from '@/app/(tabs)/_layout';
import HomeScreen from '@/app/(tabs)/index';
import OnboardingLayout from '@/app/onboarding/_layout';
import AboutScreen from '@/app/onboarding/about';
import GoalScreen from '@/app/onboarding/goal';
import TargetScreen from '@/app/onboarding/target';
import { calcTarget } from '@/lib/nutrition';
import { formatNumber } from '@/lib/format';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProfileStore } from '@/stores/profile';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
}));

const routes = {
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': HomeScreen,
  'onboarding/_layout': OnboardingLayout,
  'onboarding/about': AboutScreen,
  'onboarding/goal': GoalScreen,
  'onboarding/target': TargetScreen,
};

const isDisabled = (testID: string) =>
  screen.getByTestId(testID).props.accessibilityState?.disabled === true;

async function fillAbout() {
  await fireEvent.press(screen.getByTestId('onb-adult'));
  await fireEvent.changeText(screen.getByTestId('onb-age'), '34');
  await fireEvent.changeText(screen.getByTestId('onb-height'), '172');
  await fireEvent.changeText(screen.getByTestId('onb-weight'), '72,4');
  await fireEvent.press(screen.getByTestId('onb-sex-male'));
}

describe('onboarding flow', () => {
  beforeEach(() => {
    useProfileStore.getState().reset();
    useOnboardingStore.getState().reset();
  });

  it('keeps Continuă disabled until step 1 is valid', async () => {
    await renderRouter(routes, { initialUrl: '/onboarding/about' });
    expect(isDisabled('onb-continue')).toBe(true);
    await fillAbout();
    expect(isDisabled('onb-continue')).toBe(false);
  });

  it('shows a calm hint for an age under 18', async () => {
    await renderRouter(routes, { initialUrl: '/onboarding/about' });
    await fireEvent.changeText(screen.getByTestId('onb-age'), '16');
    expect(screen.getByText('Platewise este pentru persoane de 18 ani sau mai mult.')).toBeTruthy();
  });

  it('completes steps 1–3 and lands on home', async () => {
    await renderRouter(routes, { initialUrl: '/onboarding/about' });
    await fillAbout();
    await fireEvent.press(screen.getByTestId('onb-continue'));
    expect(screen).toHavePathname('/onboarding/goal');

    await fireEvent.press(screen.getByTestId('onb-goal-lose'));
    const expected = calcTarget({
      sex: 'male',
      age: 34,
      heightCm: 172,
      weightKg: 72.4,
      activity: 'light',
      goal: 'lose',
    });
    expect(screen.getByTestId('onb-target')).toHaveTextContent(formatNumber(expected));
    await fireEvent.press(screen.getByTestId('onb-continue'));
    expect(screen).toHavePathname('/onboarding/target');

    await fireEvent.press(screen.getByTestId('onb-target-inc'));
    expect(screen.getByTestId('onb-target')).toHaveTextContent(formatNumber(expected + 50));
    await fireEvent.press(screen.getByTestId('onb-start'));

    expect(screen).toHavePathname('/');
    const state = useProfileStore.getState();
    expect(state.hasOnboarded).toBe(true);
    expect(state.profile).toMatchObject({
      isAdult: true,
      age: 34,
      weightKg: 72.4,
      goal: 'lose',
      dailyTargetKcal: expected + 50,
      weightTracking: false,
    });
  });

  it('skip link needs the 18+ confirmation and goes to step 3 with 2.000 kcal', async () => {
    await renderRouter(routes, { initialUrl: '/onboarding/about' });
    expect(isDisabled('onb-skip')).toBe(true);
    await fireEvent.press(screen.getByTestId('onb-adult'));
    await fireEvent.press(screen.getByTestId('onb-skip'));
    expect(screen).toHavePathname('/onboarding/target');
    expect(screen.getByTestId('onb-target')).toHaveTextContent('2.000');
  });
});
