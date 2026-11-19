import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  CheckboxRow,
  ChoiceCard,
  OnboardingStep,
  SelectField,
  TextField,
} from '@/components';
import { strings } from '@/i18n';
import { validateAbout, type FieldResult } from '@/lib/onboarding';
import { useOnboardingStore } from '@/stores/onboarding';
import { space } from '@/theme';
import type { Activity, Sex } from '@/types/models';

const t = strings.onboarding.about;

const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = [
  { value: 'sedentary', get label() { return strings.onboarding.activity.sedentary; } },
  { value: 'light', get label() { return strings.onboarding.activity.light; } },
  { value: 'moderate', get label() { return strings.onboarding.activity.moderate; } },
  { value: 'intense', get label() { return strings.onboarding.activity.intense; } },
];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'female', get label() { return t.female; } },
  { value: 'male', get label() { return t.male; } },
];

/** Calm inline hint; nothing for an empty field (the button just stays disabled). */
function hint(result: FieldResult, message: string): string | undefined {
  if (result.error === 'underage') return t.errors.underage;
  if (result.error === 'invalid') return message;
  return undefined;
}

export default function AboutScreen() {
  const draft = useOnboardingStore();
  const { age, height, weight, canContinue, canSkip } = validateAbout(draft);

  return (
    <OnboardingStep
      step={1}
      title={t.title}
      intro={t.intro}
      primaryLabel={strings.common.continue}
      onPrimary={() => router.push('/onboarding/goal')}
      primaryDisabled={!canContinue}
      primaryTestID="onb-continue"
      secondaryLabel={t.skip}
      onSecondary={() => router.push('/onboarding/target')}
      secondaryVariant="link"
      secondaryDisabled={!canSkip}
      secondaryTestID="onb-skip"
    >
      <CheckboxRow
        testID="onb-adult"
        label={t.adult}
        checked={draft.isAdult}
        onChange={draft.setIsAdult}
      />
      <View style={styles.grid}>
        <View style={styles.cell}>
          <TextField
            testID="onb-age"
            label={t.age}
            value={draft.age}
            onChangeText={(text) => draft.setField('age', text)}
            keyboardType="number-pad"
            maxLength={3}
            error={hint(age, t.errors.age)}
          />
        </View>
        <View style={styles.cell}>
          <TextField
            testID="onb-height"
            label={t.height}
            value={draft.height}
            onChangeText={(text) => draft.setField('height', text)}
            keyboardType="decimal-pad"
            maxLength={5}
            error={hint(height, t.errors.height)}
          />
        </View>
        <View style={styles.cell}>
          <TextField
            testID="onb-weight"
            label={t.weight}
            value={draft.weight}
            onChangeText={(text) => draft.setField('weight', text)}
            keyboardType="decimal-pad"
            maxLength={5}
            error={hint(weight, t.errors.weight)}
          />
        </View>
        <View style={styles.cell}>
          <SelectField
            testID="onb-activity"
            label={t.activity}
            options={ACTIVITY_OPTIONS}
            value={draft.activity}
            onChange={draft.setActivity}
          />
        </View>
      </View>
      <AppText variant="label" color="textTertiary" style={styles.sexLabel}>
        {t.sexLabel}
      </AppText>
      <View style={[styles.row, styles.sexRow]} accessibilityRole="radiogroup">
        {SEX_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            testID={`onb-sex-${option.value}`}
            title={option.label}
            selected={draft.sex === option.value}
            onPress={() => draft.setSex(option.value)}
            style={styles.cell}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  // Two equal columns: (100% − gap) / 2.
  cell: { flexGrow: 1, flexBasis: '40%' },
  row: { flexDirection: 'row', gap: space.s },
  sexLabel: { marginTop: space.xxs },
  sexRow: { marginTop: -space.xs },
});
