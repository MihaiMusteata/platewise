import { Link, Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import ro from '@/i18n/ro';
import { useProfileStore } from '@/stores/profile';
import { size, space } from '@/theme';

export default function HomeScreen() {
  const hasOnboarded = useProfileStore((state) => state.hasOnboarded);
  if (!hasOnboarded) return <Redirect href="/onboarding/about" />;

  return (
    <View style={styles.container}>
      <AppText variant="h2">Platewise</AppText>
      {/* Temporary dev links (T0.4); removed when the tab shell lands. */}
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
