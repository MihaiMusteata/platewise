import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LanguagePreference } from '@/i18n';
import { kvStorage } from '@/services/kvStorage';

interface SettingsState {
  /** UI language: 'system' follows the phone (Romanian for `ro*`, otherwise English). */
  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
}

/** App preferences that are not part of the profile. Persisted synchronously (kv storage). */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'system',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'platewise.settings',
      version: 1,
      storage: createJSONStorage(() => kvStorage),
      partialize: ({ language }) => ({ language }),
    },
  ),
);
