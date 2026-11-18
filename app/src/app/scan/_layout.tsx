import { Stack } from 'expo-router';

import { colors } from '@/theme';

/** Scan flow inside the full-screen modal: scan → product found / not found → new product. */
export default function ScanFlowLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
