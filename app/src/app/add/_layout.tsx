import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Add food flow inside the page-sheet modal: search → Log food. */
export default function AddFlowLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
