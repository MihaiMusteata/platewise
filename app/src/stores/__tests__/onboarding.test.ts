import { initialDraft, useOnboardingStore } from '@/stores/onboarding';

describe('onboarding store', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('starts empty with light activity and maintain goal', () => {
    const s = useOnboardingStore.getState();
    expect(s).toMatchObject(initialDraft);
    expect(s.activity).toBe('light');
    expect(s.goal).toBe('maintain');
  });

  it('updates answers', () => {
    const s = useOnboardingStore.getState();
    s.setIsAdult(true);
    s.setField('age', '34');
    s.setField('weight', '72,4');
    s.setSex('female');
    s.setActivity('moderate');
    s.setGoal('lose');
    expect(useOnboardingStore.getState()).toMatchObject({
      isAdult: true,
      age: '34',
      weight: '72,4',
      sex: 'female',
      activity: 'moderate',
      goal: 'lose',
    });
  });

  it('drops a manual target when an estimate input changes', () => {
    const s = useOnboardingStore.getState();
    s.setTarget(2500);
    expect(useOnboardingStore.getState().targetKcal).toBe(2500);
    s.setGoal('gain');
    expect(useOnboardingStore.getState().targetKcal).toBeNull();
    s.setTarget(2500);
    s.setIsAdult(true);
    expect(useOnboardingStore.getState().targetKcal).toBe(2500);
  });

  it('resets to the initial draft', () => {
    const s = useOnboardingStore.getState();
    s.setField('height', '180');
    s.setTarget(3000);
    s.reset();
    expect(useOnboardingStore.getState()).toMatchObject(initialDraft);
  });
});
