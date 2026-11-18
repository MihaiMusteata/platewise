import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStorage } from '@/services/kvStorage';
import type { UserProfile } from '@/types/models';

interface ProfileState {
  hasOnboarded: boolean;
  profile: UserProfile | null;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (changes: Partial<UserProfile>) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      profile: null,
      completeOnboarding: (profile) => set({ profile, hasOnboarded: true }),
      updateProfile: (changes) =>
        set((state) => (state.profile ? { profile: { ...state.profile, ...changes } } : state)),
      reset: () => set({ profile: null, hasOnboarded: false }),
    }),
    {
      name: 'platewise.profile',
      version: 1,
      storage: createJSONStorage(() => kvStorage),
      partialize: ({ hasOnboarded, profile }) => ({ hasOnboarded, profile }),
    },
  ),
);
