import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { resolveLanguage, setLanguage, type LanguagePreference } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * The UI language is applied at module load (the settings store hydrates synchronously from kv
 * storage), so the first render already uses it. The subscription is registered before any
 * component subscribes, so the copy is swapped before React re-renders on a change.
 */
const applyLanguage = (preference: LanguagePreference) => setLanguage(resolveLanguage(preference));
applyLanguage(useSettingsStore.getState().language);
useSettingsStore.subscribe((state, prev) => {
  if (state.language !== prev.language) applyLanguage(state.language);
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const ready = fontsLoaded || fontError != null;
  // Screens read copy from the live `strings` object (some at module level, and the React
  // Compiler memoizes render output), so the navigation tree is re-mounted when it changes.
  const language = resolveLanguage(useSettingsStore((s) => s.language));

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack
        key={language}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        {/* Each modal has its own stack, so its follow-up screens push inside the modal. */}
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="privacy" options={{ presentation: 'card' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
