import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import ro from '@/i18n/ro';
import { size, space } from '@/theme';

/** Home placeholder; rebuilt in T2.2. The onboarding guard lives in `(tabs)/_layout`. */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <AppText variant="h2">Platewise</AppText>
      {/* Temporary dev links (T0.4); removed when Home is built (T2.2). */}
      <Link href="/dev/components" style={styles.link}>
        <AppText variant="labelL" color="brand">
          {ro.dev.components}
        </AppText>
      </Link>
      <Link href="/dev/typography" style={styles.link}>
        <AppText variant="labelL" color="brand">
          {ro.dev.typography}
        </AppText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  link: { minHeight: size.minTouch, paddingVertical: space.s },
});
