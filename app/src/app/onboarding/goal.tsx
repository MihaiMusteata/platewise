import { router, useLocalSearchParams } from 'expo-router';
import { Equal, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, ChoiceCard, HeroCard, OnboardingStep } from '@/components';
import { strings } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { draftTarget, editTarget, estimateTarget } from '@/lib/onboarding';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProfileStore } from '@/stores/profile';
import { layout, space } from '@/theme';
import type { Goal } from '@/types/models';

const t = strings.onboarding.goal;

const GOALS: { value: Goal; title: string; subtitle: string; icon: LucideIcon }[] = [
  { value: 'lose', get title() { return t.lose; }, get subtitle() { return t.loseHint; }, icon: TrendingDown },
  { value: 'maintain', get title() { return t.maintain; }, get subtitle() { return t.maintainHint; }, icon: Equal },
  { value: 'gain', get title() { return t.gain; }, get subtitle() { return t.gainHint; }, icon: TrendingUp },
];

/**
 * Onboarding step 2. With `?edit=1` (from Settings) it edits the saved goal: no step bars,
 * "Salvează" updates the profile and goes back. The target is recalculated only when the
 * profile has complete body data; otherwise the saved target is kept.
 */
export default function GoalScreen() {
  const edit = useLocalSearchParams<{ edit?: string }>().edit === '1';
  const draft = useOnboardingStore();
  const saved = useProfileStore((s) => s.profile?.dailyTargetKcal);
  const kcal = edit && saved != null ? editTarget(draft, saved) : draftTarget(draft);
  const target = formatNumber(kcal);
  const note = edit && estimateTarget(draft) == null ? strings.onboarding.edit.goalNoteManual : t.note;

  const save = () => {
    useProfileStore.getState().updateProfile({ goal: draft.goal, dailyTargetKcal: kcal });
    router.back();
  };

  return (
    <OnboardingStep
      step={edit ? undefined : 2}
      title={t.title}
      intro={t.intro}
      primaryLabel={edit ? strings.onboarding.edit.save : strings.common.continue}
      onPrimary={edit ? save : () => router.push('/onboarding/target')}
      primaryTestID={edit ? 'onb-save' : 'onb-continue'}
      secondaryLabel={edit ? strings.common.cancel : strings.common.back}
      onSecondary={() => router.back()}
      secondaryTestID="onb-back"
    >
      <View style={styles.options} accessibilityRole="radiogroup">
        {GOALS.map((goal) => (
          <ChoiceCard
            key={goal.value}
            testID={`onb-goal-${goal.value}`}
            title={goal.title}
            subtitle={goal.subtitle}
            icon={goal.icon}
            selected={draft.goal === goal.value}
            onPress={() => draft.setGoal(goal.value)}
          />
        ))}
      </View>
      <HeroCard
        contentStyle={styles.hero}
        accessibilityLabel={`${t.targetLabel}: ${target} ${t.perDay}`}
      >
        <AppText variant="label" color="heroTextSecondary">
          {t.targetLabel}
        </AppText>
        <View style={styles.valueRow}>
          <AppText variant="numberL" color="onBrand" tabular testID="onb-target">
            {target}
          </AppText>
          <AppText variant="labelL" color="heroTextSecondary">
            {t.perDay}
          </AppText>
        </View>
        <AppText variant="body" color="heroTextSecondary">
          {note}
        </AppText>
      </HeroCard>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  options: { gap: space.s },
  hero: { paddingVertical: layout.cardPadding, paddingHorizontal: space.l, gap: space.xs },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
});
