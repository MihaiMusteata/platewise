import { router } from 'expo-router';
import { Equal, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, ChoiceCard, HeroCard, OnboardingStep } from '@/components';
import ro from '@/i18n/ro';
import { formatNumber } from '@/lib/format';
import { draftTarget } from '@/lib/onboarding';
import { useOnboardingStore } from '@/stores/onboarding';
import { layout, space } from '@/theme';
import type { Goal } from '@/types/models';

const t = ro.onboarding.goal;

const GOALS: { value: Goal; title: string; subtitle: string; icon: LucideIcon }[] = [
  { value: 'lose', title: t.lose, subtitle: t.loseHint, icon: TrendingDown },
  { value: 'maintain', title: t.maintain, subtitle: t.maintainHint, icon: Equal },
  { value: 'gain', title: t.gain, subtitle: t.gainHint, icon: TrendingUp },
];

export default function GoalScreen() {
  const draft = useOnboardingStore();
  const target = formatNumber(draftTarget(draft));

  return (
    <OnboardingStep
      step={2}
      title={t.title}
      intro={t.intro}
      primaryLabel={ro.common.continue}
      onPrimary={() => router.push('/onboarding/target')}
      primaryTestID="onb-continue"
      secondaryLabel={ro.common.back}
      onSecondary={() => router.back()}
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
          {t.note}
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
