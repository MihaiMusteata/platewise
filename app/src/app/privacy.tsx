import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, Card, FlowHeader, Screen } from '@/components';
import { strings } from '@/i18n';
import { space } from '@/theme';

const t = strings.privacy;

/** Short in-app privacy summary, opened from Settings. A hosted policy URL is still needed (R1). */
export default function PrivacyScreen() {
  return (
    <Screen scroll>
      <FlowHeader title={t.title} onBack={() => router.back()} />
      {t.sections.map((section) => (
        <Card key={section.title} style={styles.card}>
          <AppText variant="bodyLStrong" accessibilityRole="header">
            {section.title}
          </AppText>
          <AppText variant="body" color="textSecondary">
            {section.body}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.xxs },
});
