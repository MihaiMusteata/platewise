import {
  DEFAULT_TARGET,
  buildProfile,
  checkAge,
  checkHeight,
  checkWeight,
  draftTarget,
  estimateTarget,
  validateAbout,
  type OnboardingDraft,
} from '@/lib/onboarding';
import { calcTarget } from '@/lib/nutrition';

const complete: OnboardingDraft = {
  isAdult: true,
  age: '34',
  height: '172',
  weight: '72,4',
  sex: 'male',
  activity: 'light',
  goal: 'maintain',
  targetKcal: null,
};

describe('field checks', () => {
  it('accepts ages 18–100 as whole years', () => {
    expect(checkAge('18')).toEqual({ value: 18, error: null });
    expect(checkAge('100').value).toBe(100);
    expect(checkAge('101').error).toBe('invalid');
    expect(checkAge('30,5').error).toBe('invalid');
    expect(checkAge('abc').error).toBe('invalid');
  });

  it('reports under 18 as underage', () => {
    expect(checkAge('17').error).toBe('underage');
    expect(checkAge('0').error).toBe('underage');
  });

  it('reports empty fields separately', () => {
    expect(checkAge('').error).toBe('empty');
    expect(checkHeight('  ').error).toBe('empty');
    expect(checkWeight('').error).toBe('empty');
  });

  it('checks height 120–230 cm', () => {
    expect(checkHeight('120').value).toBe(120);
    expect(checkHeight('230').value).toBe(230);
    expect(checkHeight('172,5').value).toBe(172.5);
    expect(checkHeight('119').error).toBe('invalid');
    expect(checkHeight('231').error).toBe('invalid');
  });

  it('checks weight 35–300 kg with comma decimals', () => {
    expect(checkWeight('72,4').value).toBe(72.4);
    expect(checkWeight('72.4').value).toBe(72.4);
    expect(checkWeight('35').value).toBe(35);
    expect(checkWeight('300').value).toBe(300);
    expect(checkWeight('34,9').error).toBe('invalid');
    expect(checkWeight('300,1').error).toBe('invalid');
    expect(checkWeight('72,4,1').error).toBe('invalid');
  });
});

describe('validateAbout', () => {
  it('allows continuing when everything is valid', () => {
    expect(validateAbout(complete).canContinue).toBe(true);
  });

  it('requires the 18+ confirmation', () => {
    const v = validateAbout({ ...complete, isAdult: false });
    expect(v.canContinue).toBe(false);
    expect(v.canSkip).toBe(false);
  });

  it('requires a sex and every field', () => {
    expect(validateAbout({ ...complete, sex: null }).canContinue).toBe(false);
    expect(validateAbout({ ...complete, weight: '' }).canContinue).toBe(false);
    expect(validateAbout({ ...complete, age: '16' }).canContinue).toBe(false);
  });

  it('lets the user skip with empty fields but not with invalid ones', () => {
    const empty = { ...complete, age: '', height: '', weight: '', sex: null };
    expect(validateAbout(empty).canSkip).toBe(true);
    expect(validateAbout({ ...empty, age: '16' }).canSkip).toBe(false);
    expect(validateAbout({ ...empty, height: '90' }).canSkip).toBe(false);
  });
});

describe('targets', () => {
  it('estimates from body data and goal', () => {
    const expected = calcTarget({
      sex: 'male',
      age: 34,
      heightCm: 172,
      weightKg: 72.4,
      activity: 'light',
      goal: 'lose',
    });
    expect(estimateTarget({ ...complete, goal: 'lose' })).toBe(expected);
    expect(expected % 50).toBe(0);
  });

  it('has no estimate without body data, so step 3 starts at 2.000', () => {
    const empty = { ...complete, weight: '' };
    expect(estimateTarget(empty)).toBeNull();
    expect(draftTarget(empty)).toBe(DEFAULT_TARGET);
  });

  it('prefers a manual target', () => {
    expect(draftTarget({ ...complete, targetKcal: 2350 })).toBe(2350);
  });
});

describe('buildProfile', () => {
  it('maps the draft with default switches off', () => {
    expect(buildProfile({ ...complete, targetKcal: 2300 })).toEqual({
      isAdult: true,
      age: 34,
      heightCm: 172,
      weightKg: 72.4,
      sex: 'male',
      activity: 'light',
      goal: 'maintain',
      dailyTargetKcal: 2300,
      weightTracking: false,
      mealReminders: false,
      paused: false,
    });
  });

  it('keeps entered values on the skip path and stores 0 for missing ones', () => {
    const profile = buildProfile({ ...complete, age: '40', height: '', weight: '', sex: null });
    expect(profile).toMatchObject({ age: 40, heightCm: 0, weightKg: 0, sex: 'female' });
    expect(profile.dailyTargetKcal).toBe(DEFAULT_TARGET);
  });
});
