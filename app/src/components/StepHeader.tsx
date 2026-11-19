import { StyleSheet, View } from 'react-native';

import { strings } from '@/i18n';
import { colors, radius, size, space } from '@/theme';

import { AppText } from './AppText';

export interface StepHeaderProps {
  /** 1-based current step. */
  step: number;
  total: number;
}

/** Segmented step bars plus "Pasul x din y" (onboarding). */
export function StepHeader({ step, total }: StepHeaderProps) {
  const label = strings.onboarding.step(step, total);
  return (
    <>
      <View style={styles.bars} accessibilityRole="image" accessibilityLabel={label}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.bar, { backgroundColor: i < step ? colors.brand : colors.stepInactive }]}
          />
        ))}
      </View>
      <AppText variant="label" color="textSecondary" importantForAccessibility="no">
        {label}
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', gap: space.xs },
  bar: { flex: 1, height: size.progressBar, borderRadius: radius.xs },
});
