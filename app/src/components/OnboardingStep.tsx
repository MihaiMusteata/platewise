import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Button, type ButtonVariant } from './Button';
import { Screen } from './Screen';
import { StepHeader } from './StepHeader';

export interface OnboardingStepProps {
  /** Current step; omit to hide the step bars (editing a step from Settings). */
  step?: number;
  total?: number;
  title: string;
  intro: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel: string;
  onSecondary: () => void;
  /** 'link' (brand, e.g. "Îmi setez singur ținta") or 'text' (grey "Înapoi"). */
  secondaryVariant?: Extract<ButtonVariant, 'link' | 'text'>;
  secondaryDisabled?: boolean;
  primaryTestID?: string;
  secondaryTestID?: string;
}

/** Shared onboarding layout: step bars, H1, intro, content, bottom primary + secondary button. */
export function OnboardingStep({
  step,
  total = 3,
  title,
  intro,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  secondaryVariant = 'text',
  secondaryDisabled = false,
  primaryTestID,
  secondaryTestID,
}: OnboardingStepProps) {
  return (
    <Screen scroll contentStyle={styles.content}>
      {step != null && <StepHeader step={step} total={total} />}
      <AppText variant="h1" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="bodyL" color="textSecondary">
        {intro}
      </AppText>
      {children}
      <View style={styles.spacer} />
      <Button
        label={primaryLabel}
        onPress={onPrimary}
        disabled={primaryDisabled}
        testID={primaryTestID}
      />
      <Button
        label={secondaryLabel}
        onPress={onSecondary}
        variant={secondaryVariant}
        disabled={secondaryDisabled}
        testID={secondaryTestID}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  spacer: { flexGrow: 1 },
});
