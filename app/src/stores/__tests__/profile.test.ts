import type { UserProfile } from '@/types/models';

const mockMemory = new Map<string, string>();

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItemSync: (key: string) => mockMemory.get(key) ?? null,
    setItemSync: (key: string, value: string) => mockMemory.set(key, value),
    removeItemSync: (key: string) => mockMemory.delete(key),
  },
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

function loadStore() {
  let store!: typeof import('@/stores/profile').useProfileStore;
  jest.isolateModules(() => {
    store = jest.requireActual<typeof import('@/stores/profile')>('@/stores/profile').useProfileStore;
  });
  return store;
}

describe('profile store', () => {
  beforeEach(() => mockMemory.clear());

  it('starts not onboarded', () => {
    const store = loadStore();
    expect(store.getState().hasOnboarded).toBe(false);
    expect(store.getState().profile).toBeNull();
  });

  it('completes onboarding and persists across restarts', () => {
    loadStore().getState().completeOnboarding(profile);
    const restarted = loadStore();
    expect(restarted.getState().hasOnboarded).toBe(true);
    expect(restarted.getState().profile).toEqual(profile);
  });

  it('updates fields of an existing profile', () => {
    const store = loadStore();
    store.getState().completeOnboarding(profile);
    store.getState().updateProfile({ weightTracking: true, dailyTargetKcal: 1850 });
    expect(store.getState().profile).toMatchObject({ weightTracking: true, dailyTargetKcal: 1850 });
  });

  it('ignores updates before onboarding', () => {
    const store = loadStore();
    store.getState().updateProfile({ paused: true });
    expect(store.getState().profile).toBeNull();
  });

  it('resets to first launch', () => {
    const store = loadStore();
    store.getState().completeOnboarding(profile);
    store.getState().reset();
    expect(loadStore().getState().hasOnboarded).toBe(false);
  });
});
