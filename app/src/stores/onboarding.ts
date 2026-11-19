import { create } from 'zustand';

import type { OnboardingDraft } from '@/lib/onboarding';
import type { Activity, Goal, Sex } from '@/types/models';

type BodyField = 'age' | 'height' | 'weight';

interface OnboardingState extends OnboardingDraft {
  setIsAdult: (isAdult: boolean) => void;
  setField: (field: BodyField, text: string) => void;
  setSex: (sex: Sex) => void;
  setActivity: (activity: Activity) => void;
  setGoal: (goal: Goal) => void;
  /** Manual target from the step 3 stepper. */
  setTarget: (kcal: number) => void;
  /** Replaces the whole draft (edit mode from Settings). */
  load: (draft: OnboardingDraft) => void;
  reset: () => void;
}

export const initialDraft: OnboardingDraft = {
  isAdult: false,
  age: '',
  height: '',
  weight: '',
  sex: null,
  activity: 'light',
  goal: 'maintain',
  targetKcal: null,
};

/**
 * Shared answers for onboarding steps 1–3. Not persisted.
 * Changing any input of the estimate drops a manual target so step 3 shows the new estimate.
 */
export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initialDraft,
  setIsAdult: (isAdult) => set({ isAdult }),
  setField: (field, text) => set({ [field]: text, targetKcal: null }),
  setSex: (sex) => set({ sex, targetKcal: null }),
  setActivity: (activity) => set({ activity, targetKcal: null }),
  // Re-selecting the current goal keeps a manual target (matters when editing from Settings).
  setGoal: (goal) => set((s) => (s.goal === goal ? {} : { goal, targetKcal: null })),
  setTarget: (targetKcal) => set({ targetKcal }),
  load: (draft) => set(draft),
  reset: () => set(initialDraft),
}));
