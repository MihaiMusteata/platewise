import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { ActionSheetIOS, Alert, Linking, type AlertButton } from 'react-native';

// Registers the root layout's language subscription (settings store → active language).
import '@/app/_layout';
import TabsLayout from '@/app/(tabs)/_layout';
import SettingsScreen from '@/app/(tabs)/settings';
import OnboardingLayout from '@/app/onboarding/_layout';
import GoalScreen from '@/app/onboarding/goal';
import TargetScreen from '@/app/onboarding/target';
import PrivacyScreen from '@/app/privacy';
import { getLanguage, setLanguage } from '@/i18n';
import { calcTarget } from '@/lib/nutrition';
import { exportLogCsv } from '@/services/exportCsv';
import { useLogStore } from '@/stores/log';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProfileStore } from '@/stores/profile';
import { useSettingsStore } from '@/stores/settings';
import type { UserProfile } from '@/types/models';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: () => {}, removeItemSync: () => true },
}));
jest.mock('@/services/exportCsv', () => ({ exportLogCsv: jest.fn() }));

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
  '(tabs)/progress': () => null,
  '(tabs)/plans': () => null,
  '(tabs)/settings': SettingsScreen,
  'onboarding/_layout': OnboardingLayout,
  'onboarding/about': () => null,
  'onboarding/goal': GoalScreen,
  'onboarding/target': TargetScreen,
  privacy: PrivacyScreen,
};

const clearAll = jest.fn(async () => {});
let alert: jest.SpyInstance;

/**
 * Leaving an edit screen pops the onboarding stack. The in-memory test router then reports the
 * tabs at "/" (verified on the simulator that the app returns to Settings), so tests check that
 * the edit screen was left rather than the exact tab.
 */
const expectBackFromEdit = () => {
  expect(screen).not.toHavePathname('/onboarding/target');
  expect(screen).not.toHavePathname('/onboarding/goal');
  expect(screen.queryByTestId('onb-save')).toBeNull();
};

/** Makes the next Alert press the button with this style (or text). */
function pressInAlert(match: (b: AlertButton) => boolean) {
  alert.mockImplementation((_title, _message, buttons?: AlertButton[]) => {
    buttons?.find(match)?.onPress?.();
  });
}

async function renderSettings(overrides: Partial<UserProfile> = {}) {
  useProfileStore.getState().completeOnboarding({ ...profile, ...overrides });
  await renderRouter(routes, { initialUrl: '/settings' });
}

beforeEach(() => {
  useProfileStore.getState().reset();
  useOnboardingStore.getState().reset();
  useLogStore.setState({ clearAll });
  clearAll.mockClear();
  jest.mocked(exportLogCsv).mockReset();
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => alert.mockRestore());

describe('settings', () => {
  it('shows profile values in Romanian format', async () => {
    await renderSettings({ dailyTargetKcal: 2000, goal: 'lose' });
    expect(screen.getByTestId('settings-target')).toHaveTextContent(/2\.000 kcal/);
    expect(screen.getByTestId('settings-goal')).toHaveTextContent(/Slăbire/);
    expect(screen.getByText('Backup și sincronizare')).toBeTruthy();
  });

  it('toggles weight tracking and pause in the profile', async () => {
    await renderSettings();
    await fireEvent(screen.getByTestId('settings-weight-switch'), 'valueChange', true);
    expect(useProfileStore.getState().profile?.weightTracking).toBe(true);
    await fireEvent(screen.getByTestId('settings-pause-switch'), 'valueChange', true);
    expect(useProfileStore.getState().profile?.paused).toBe(true);
    expect(screen.getByTestId('settings-reminders-switch').props.disabled).toBe(true);
  });

  it('exports through the service and explains an empty log calmly', async () => {
    jest.mocked(exportLogCsv).mockResolvedValue('empty');
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-export'));
    expect(exportLogCsv).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('Jurnalul e gol', expect.any(String));
  });

  it('does not alert when the share sheet opened', async () => {
    jest.mocked(exportLogCsv).mockResolvedValue('shared');
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-export'));
    expect(alert).not.toHaveBeenCalled();
  });

  it('deletes all data after confirmation and starts onboarding', async () => {
    await renderSettings();
    useOnboardingStore.getState().setField('age', '44');
    pressInAlert((b) => b.style === 'destructive');
    await act(async () => {
      fireEvent.press(screen.getByTestId('settings-delete'));
    });
    expect(clearAll).toHaveBeenCalledTimes(1);
    expect(useProfileStore.getState()).toMatchObject({ hasOnboarded: false, profile: null });
    expect(useOnboardingStore.getState().age).toBe('');
    expect(screen).toHavePathname('/onboarding/about');
  });

  it('keeps everything when the confirmation is cancelled', async () => {
    await renderSettings();
    pressInAlert((b) => b.style === 'cancel');
    await fireEvent.press(screen.getByTestId('settings-delete'));
    expect(clearAll).not.toHaveBeenCalled();
    expect(useProfileStore.getState().hasOnboarded).toBe(true);
  });

  it('opens privacy and the support e-mail', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderSettings();
    pressInAlert((b) => b.text === 'Scrie-ne');
    await fireEvent.press(screen.getByTestId('settings-support'));
    expect(openURL).toHaveBeenCalledWith('mailto:musteatamihai2002@icloud.com?subject=Platewise');
    await fireEvent.press(screen.getByTestId('settings-privacy'));
    expect(screen).toHavePathname('/privacy');
    openURL.mockRestore();
  });
});

describe('language', () => {
  let sheet: jest.SpyInstance;

  /** Makes the next action sheet pick the option at this index. */
  const pickInSheet = (index: number) =>
    sheet.mockImplementation((_options, callback: (i: number) => void) => callback(index));

  beforeEach(() => {
    useSettingsStore.setState({ language: 'system' });
    sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});
  });

  afterEach(() => {
    sheet.mockRestore();
    setLanguage('ro');
  });

  it('shows the current choice and offers Automat / Română / English', async () => {
    await renderSettings();
    expect(screen.getByTestId('settings-language')).toHaveTextContent(/Limbă \/ Language/);
    expect(screen.getByTestId('settings-language')).toHaveTextContent(/Automat/);
    await fireEvent.press(screen.getByTestId('settings-language'));
    expect(sheet).toHaveBeenCalledWith(
      expect.objectContaining({
        options: ['Automat', 'Română', 'English', 'Renunță'],
        cancelButtonIndex: 3,
      }),
      expect.any(Function),
    );
  });

  it('saves the chosen language in the settings store', async () => {
    await renderSettings();
    pickInSheet(2);
    await fireEvent.press(screen.getByTestId('settings-language'));
    expect(useSettingsStore.getState().language).toBe('en');
    pickInSheet(0);
    await fireEvent.press(screen.getByTestId('settings-language'));
    expect(useSettingsStore.getState().language).toBe('system');
  });

  it('cancel keeps the language', async () => {
    await renderSettings();
    pickInSheet(3);
    await fireEvent.press(screen.getByTestId('settings-language'));
    expect(useSettingsStore.getState().language).toBe('system');
  });

  it('the root layout applies a change to the active language', async () => {
    expect(getLanguage()).toBe('ro');
    useSettingsStore.getState().setLanguage('en');
    expect(getLanguage()).toBe('en');
    useSettingsStore.getState().setLanguage('ro');
    expect(getLanguage()).toBe('ro');
  });

  it('renders in English after switching', async () => {
    useSettingsStore.setState({ language: 'en' });
    await renderSettings({ dailyTargetKcal: 2000, goal: 'lose' });
    expect(screen.getByTestId('settings-title')).toHaveTextContent('Settings');
    expect(screen.getByText('Goals and units')).toBeTruthy();
    expect(screen.getByTestId('settings-target')).toHaveTextContent(/2,000 kcal/);
    expect(screen.getByTestId('settings-goal')).toHaveTextContent(/Lose weight/);
    expect(screen.getByTestId('settings-language')).toHaveTextContent(/English/);
    expect(screen.getByText('Home')).toBeTruthy();
  });
});

describe('editing from settings', () => {
  it('edits the target and goes back to settings', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-target'));
    expect(screen).toHavePathname('/onboarding/target');
    expect(screen.queryByText('Pasul 3 din 3')).toBeNull();
    expect(screen.getByTestId('onb-target')).toHaveTextContent('1.900');

    await fireEvent.press(screen.getByTestId('onb-target-inc'));
    await fireEvent.press(screen.getByTestId('onb-save'));

    expectBackFromEdit();
    expect(useProfileStore.getState().profile?.dailyTargetKcal).toBe(1950);
    expect(useProfileStore.getState().hasOnboarded).toBe(true);
  });

  it('recalculates the target for a new goal when body data is complete', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-goal'));
    expect(screen).toHavePathname('/onboarding/goal');
    await fireEvent.press(screen.getByTestId('onb-goal-lose'));
    await fireEvent.press(screen.getByTestId('onb-save'));

    const expected = calcTarget({ ...profile, goal: 'lose' });
    expectBackFromEdit();
    expect(useProfileStore.getState().profile).toMatchObject({ goal: 'lose', dailyTargetKcal: expected });
  });

  it('keeps the saved target when body data was skipped (stored as 0)', async () => {
    await renderSettings({ age: 0, heightCm: 0, weightKg: 0, dailyTargetKcal: 2200 });
    await fireEvent.press(screen.getByTestId('settings-goal'));
    await fireEvent.press(screen.getByTestId('onb-goal-gain'));
    expect(screen.getByTestId('onb-target')).toHaveTextContent('2.200');
    await fireEvent.press(screen.getByTestId('onb-save'));
    expect(useProfileStore.getState().profile).toMatchObject({ goal: 'gain', dailyTargetKcal: 2200 });
  });

  it('cancel leaves the profile unchanged', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByTestId('settings-goal'));
    await fireEvent.press(screen.getByTestId('onb-goal-gain'));
    await fireEvent.press(screen.getByTestId('onb-back'));
    expectBackFromEdit();
    expect(useProfileStore.getState().profile).toMatchObject({ goal: 'maintain', dailyTargetKcal: 1900 });
  });
});

describe('hidden dev section', () => {
  it('appears after long-pressing the title', async () => {
    await renderSettings();
    expect(screen.queryByTestId('dev-demo-data')).toBeNull();
    await fireEvent(screen.getByTestId('settings-title'), 'longPress');
    expect(screen.getByTestId('dev-demo-data')).toBeTruthy();
    expect(screen.getByTestId('dev-reset-scans')).toBeTruthy();
  });
});
