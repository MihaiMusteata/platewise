import { router, useLocalSearchParams } from 'expo-router';
import { Heart, Minus, Plus } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, HeroCard, OnboardingStep } from '@/components';
import ro from '@/i18n/ro';
import { formatNumber } from '@/lib/format';
import { TARGET_MAX, TARGET_MIN, clampTarget, stepTarget } from '@/lib/nutrition';
import { buildProfile, draftTarget, estimateTarget } from '@/lib/onboarding';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProfileStore } from '@/stores/profile';
import { borderWidth, colors, iconStroke, opacity, radius, size, space } from '@/theme';

const t = ro.onboarding.target;

function StepButton({
  icon: Icon,
  label,
  disabled,
  onPress,
  testID,
}: {
  icon: typeof Plus;
  label: string;
  disabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.stepButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon size={size.iconM} color={colors.onBrand} strokeWidth={iconStroke.bold} />
    </Pressable>
  );
}

/**
 * Onboarding step 3. With `?edit=1` (from Settings) it edits the saved target: no step bars and
 * no "before you start" card; "Salvează" updates the profile and goes back.
 */
export default function TargetScreen() {
  const edit = useLocalSearchParams<{ edit?: string }>().edit === '1';
  const draft = useOnboardingStore();
  const target = draftTarget(draft);
  // Body data present → the "calculated" note (even after ± tweaks); skip path → "starting value" note.
  const estimated = estimateTarget(draft) != null;

  const change = (direction: 1 | -1) => draft.setTarget(stepTarget(target, direction));

  const finish = () => {
    useProfileStore.getState().completeOnboarding(buildProfile(draft));
    router.replace('/');
    useOnboardingStore.getState().reset();
  };

  const save = () => {
    useProfileStore.getState().updateProfile({ dailyTargetKcal: clampTarget(target) });
    router.back();
  };

  return (
    <OnboardingStep
      step={edit ? undefined : 3}
      title={t.title}
      intro={edit ? t.editIntro : t.intro}
      primaryLabel={edit ? ro.onboarding.edit.save : t.start}
      onPrimary={edit ? save : finish}
      primaryTestID={edit ? 'onb-save' : 'onb-start'}
      secondaryLabel={edit ? ro.common.cancel : ro.common.back}
      onSecondary={() => router.back()}
      secondaryTestID="onb-back"
    >
      <HeroCard contentStyle={styles.hero}>
        <View style={styles.stepRow}>
          <StepButton
            testID="onb-target-dec"
            icon={Minus}
            label={t.decrease}
            disabled={target <= TARGET_MIN}
            onPress={() => change(-1)}
          />
          <View style={styles.value} accessible accessibilityLabel={`${formatNumber(target)} ${t.perDay}`}>
            <AppText variant="display" color="onBrand" tabular testID="onb-target">
              {formatNumber(target)}
            </AppText>
            <AppText variant="label" color="heroTextSecondary">
              {t.perDay}
            </AppText>
          </View>
          <StepButton
            testID="onb-target-inc"
            icon={Plus}
            label={t.increase}
            disabled={target >= TARGET_MAX}
            onPress={() => change(1)}
          />
        </View>
        <View style={styles.divider} />
        <AppText variant="body" color="heroTextSecondary" align="center">
          {estimated ? t.note : t.noteManual}
        </AppText>
      </HeroCard>
      {!edit && (
        <View style={styles.care}>
          <View style={styles.careIcon}>
            <Heart size={size.iconM} color={colors.brand} strokeWidth={iconStroke.regular} />
          </View>
          <View style={styles.careText}>
            <AppText variant="bodyLStrong">{t.careTitle}</AppText>
            <AppText variant="body" color="textOnMint">
              {t.careBody}
            </AppText>
            <Pressable
              onPress={() => Alert.alert(t.careLink, t.careSheet)}
              accessibilityRole="link"
              accessibilityLabel={t.careLink}
              hitSlop={space.m}
              style={({ pressed }) => [styles.careLink, pressed && styles.linkPressed]}
            >
              <AppText variant="bodyStrong" color="brand">
                {t.careLink}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  hero: { padding: space.l, gap: space.m },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepButton: {
    width: size.heroStepper,
    height: size.heroStepper,
    borderRadius: radius.m,
    backgroundColor: colors.heroButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  value: { alignItems: 'center', gap: space.xxs },
  divider: { height: borderWidth.hairline, backgroundColor: colors.heroDivider },
  care: {
    backgroundColor: colors.mint,
    borderRadius: radius.l,
    padding: space.m,
    flexDirection: 'row',
    gap: space.m,
  },
  careIcon: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careText: { flex: 1, gap: space.xs },
  careLink: { marginTop: space.xxs, alignSelf: 'flex-start' },
  linkPressed: { opacity: opacity.pressed },
});
