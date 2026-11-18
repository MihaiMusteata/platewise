import { parseDecimal } from '@/lib/format';
import { calcTarget, clampTarget } from '@/lib/nutrition';
import type { Activity, Goal, Sex, UserProfile } from '@/types/models';

export const AGE_MIN = 18;
export const AGE_MAX = 100;
export const HEIGHT_MIN = 120;
export const HEIGHT_MAX = 230;
export const WEIGHT_MIN = 35;
export const WEIGHT_MAX = 300;

/** Starting target when the user sets it manually without body data. */
export const DEFAULT_TARGET = 2000;

/**
 * Validation outcome of one numeric field.
 * `empty` is not shown to the user (the button just stays disabled);
 * `underage` is an age below 18; `invalid` is anything unparsable or out of range.
 */
export type FieldError = 'empty' | 'invalid' | 'underage';

export interface FieldResult {
  value: number | null;
  error: FieldError | null;
}

function checkRange(text: string, min: number, max: number, integer = false): FieldResult {
  if (text.trim() === '') return { value: null, error: 'empty' };
  const value = parseDecimal(text);
  if (Number.isNaN(value) || (integer && !Number.isInteger(value))) {
    return { value: null, error: 'invalid' };
  }
  if (value < min || value > max) return { value: null, error: 'invalid' };
  return { value, error: null };
}

/** Age in whole years, 18–100. Below 18 reports `underage`. */
export function checkAge(text: string): FieldResult {
  const result = checkRange(text, 0, AGE_MAX, true);
  if (result.value != null && result.value < AGE_MIN) return { value: null, error: 'underage' };
  return result;
}

/** Height in cm, 120–230; decimals with comma or dot. */
export function checkHeight(text: string): FieldResult {
  return checkRange(text, HEIGHT_MIN, HEIGHT_MAX);
}

/** Weight in kg, 35–300; decimals with comma or dot ("72,4"). */
export function checkWeight(text: string): FieldResult {
  return checkRange(text, WEIGHT_MIN, WEIGHT_MAX);
}

/** In-progress onboarding answers (text fields kept as typed). */
export interface OnboardingDraft {
  isAdult: boolean;
  age: string;
  height: string;
  weight: string;
  sex: Sex | null;
  activity: Activity;
  goal: Goal;
  /** Manually adjusted target; null means "use the estimate". */
  targetKcal: number | null;
}

export interface AboutValidation {
  age: FieldResult;
  height: FieldResult;
  weight: FieldResult;
  /** Step 1 complete: 18+ confirmed, all fields valid, sex chosen. */
  canContinue: boolean;
  /** "Îmi setez singur ținta": 18+ confirmed and nothing entered is invalid (empty is fine). */
  canSkip: boolean;
}

export function validateAbout(draft: OnboardingDraft): AboutValidation {
  const age = checkAge(draft.age);
  const height = checkHeight(draft.height);
  const weight = checkWeight(draft.weight);
  const fields = [age, height, weight];
  const allValid = fields.every((f) => f.error == null);
  const noneInvalid = fields.every((f) => f.error == null || f.error === 'empty');
  return {
    age,
    height,
    weight,
    canContinue: draft.isAdult && allValid && draft.sex != null,
    canSkip: draft.isAdult && noneInvalid,
  };
}

/** Estimated target from the draft, or null when body data is incomplete. */
export function estimateTarget(draft: OnboardingDraft): number | null {
  const { age, height, weight } = validateAbout(draft);
  if (age.value == null || height.value == null || weight.value == null || draft.sex == null) {
    return null;
  }
  return calcTarget({
    sex: draft.sex,
    age: age.value,
    heightCm: height.value,
    weightKg: weight.value,
    activity: draft.activity,
    goal: draft.goal,
  });
}

/** Target shown on step 3: manual value, else the estimate, else 2.000. */
export function draftTarget(draft: OnboardingDraft): number {
  return draft.targetKcal ?? estimateTarget(draft) ?? DEFAULT_TARGET;
}

/**
 * Profile saved when onboarding finishes. Body fields left empty on the skip path
 * are stored as 0 ("not provided"); a missing sex falls back to 'female'.
 */
export function buildProfile(draft: OnboardingDraft): UserProfile {
  const { age, height, weight } = validateAbout(draft);
  return {
    isAdult: draft.isAdult,
    age: age.value ?? 0,
    heightCm: height.value ?? 0,
    weightKg: weight.value ?? 0,
    sex: draft.sex ?? 'female',
    activity: draft.activity,
    goal: draft.goal,
    dailyTargetKcal: clampTarget(draftTarget(draft)),
    weightTracking: false,
    mealReminders: false,
    paused: false,
  };
}
