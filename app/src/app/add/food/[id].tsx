import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  FoodThumb,
  IconButton,
  MacroCard,
  Screen,
  SegmentedControl,
  Stepper,
  type SegmentOption,
} from '@/components';
import { getDb, getFood } from '@/db';
import ro from '@/i18n/ro';
import { formatDecimal, formatNumber } from '@/lib/format';
import { defaultMealFor, MEALS } from '@/lib/meals';
import { macroGoals, nutrientsFor } from '@/lib/nutrition';
import {
  convertPortion,
  formatAmount,
  foodSubtitle,
  initialPortion,
  PORTION_RANGES,
  portionLabel,
  portionUnit,
  servingGramsOf,
  toGrams,
  type Portion,
  type PortionMode,
} from '@/lib/portion';
import { thumbTintFor } from '@/lib/search';
import { useLogStore } from '@/stores/log';
import { useProfileStore } from '@/stores/profile';
import { borderWidth, colors, size, space } from '@/theme';
import type { Food, Meal } from '@/types/models';

const isMeal = (value: unknown): value is Meal => MEALS.includes(value as Meal);

const MODE_OPTIONS: readonly SegmentOption<PortionMode>[] = [
  { value: 'grams', label: ro.logFood.grams },
  { value: 'servings', label: ro.logFood.servings },
];

const MACRO_KEYS = ['protein', 'carbs', 'fat'] as const;

/**
 * Log food (LogFood.html): amount in grams or servings, live calories and macros, meal choice,
 * then "Adaugă la <masă>" saves the entry and closes the whole add flow back to Home.
 */
export default function LogFoodScreen() {
  const params = useLocalSearchParams<{ id: string; meal?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [food, setFood] = useState<Food | null | undefined>(undefined);
  const [portion, setPortion] = useState<Portion | null>(null);
  const [meal, setMeal] = useState<Meal>(() =>
    isMeal(params.meal) ? params.meal : defaultMealFor(new Date()),
  );
  const [saving, setSaving] = useState(false);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    let active = true;
    (async () => {
      const found = id ? await getFood(await getDb(), id) : null;
      if (!active) return;
      setFood(found);
      if (found) setPortion(initialPortion(found));
    })().catch(() => active && setFood(null));
    return () => {
      active = false;
    };
  }, [id]);

  const header = (
    <View style={styles.header}>
      <IconButton
        testID="log-back"
        icon={ChevronLeft}
        iconSize="S"
        accessibilityLabel={ro.common.back}
        onPress={() => router.back()}
      />
      <AppText variant="bodyLStrong" accessibilityRole="header">
        {ro.logFood.title}
      </AppText>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (food === undefined || (food && !portion)) {
    return <Screen topInset={false}>{header}</Screen>;
  }

  if (food === null || !portion) {
    return (
      <Screen topInset={false}>
        {header}
        <View style={styles.notFound} testID="log-not-found">
          <AppText variant="h3">{ro.logFood.notFoundTitle}</AppText>
          <AppText variant="bodyL" color="textSecondary">
            {ro.logFood.notFoundBody}
          </AppText>
        </View>
        <Button variant="outline" label={ro.logFood.backToSearch} onPress={() => router.back()} />
      </Screen>
    );
  }

  const servingGrams = servingGramsOf(food);
  const grams = toGrams(portion, servingGrams);
  const totals = nutrientsFor(food.per100g, grams);
  const kcal = formatNumber(totals.kcal);
  const goals = profile && !profile.paused ? macroGoals(profile.dailyTargetKcal) : undefined;
  const range = PORTION_RANGES[portion.mode];
  const per100 = food.per100g;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await useLogStore.getState().add({ meal, foodId: food.id, grams });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      // Close the whole add modal (search + Log food) and land on Home.
      router.dismissTo('/');
    } catch {
      // Saving locally practically never fails; let the user try again.
      setSaving(false);
    }
  };

  return (
    <Screen scroll topInset={false} contentStyle={styles.content}>
      {header}

      <View style={styles.foodRow}>
        <FoodThumb size="l" tint={thumbTintFor(food.id)} name={food.name} />
        <View style={styles.foodText}>
          <AppText variant="sectionTitle" testID="log-name">
            {food.name}
          </AppText>
          <AppText variant="body" color="textSecondary" testID="log-subtitle">
            {foodSubtitle(food)}
          </AppText>
        </View>
      </View>

      <Card style={styles.nutrition}>
        <View accessibilityLabel={ro.logFood.nutritionLabel} style={styles.kcalRow}>
          <AppText variant="numberL" tabular testID="log-kcal">
            {kcal}
          </AppText>
          <AppText variant="labelL" color="textSecondary" style={styles.kcalUnit}>
            {ro.logFood.kcalFor(
              portion.mode === 'grams'
                ? `${formatAmount(grams)} ${ro.common.grams}`
                : portionLabel(portion, food.servingName),
            )}
          </AppText>
        </View>
        <View style={styles.macros}>
          {MACRO_KEYS.map((key) => (
            <MacroCard
              key={key}
              testID={`log-macro-${key}`}
              variant="compact"
              macro={key}
              value={totals[key]}
              goal={goals?.[key]}
            />
          ))}
        </View>
        <View style={styles.per100}>
          <AppText variant="footnote" color="textSecondary" tabular>
            {ro.logFood.per100(
              formatNumber(per100.kcal),
              formatDecimal(per100.protein, 1, true),
              formatDecimal(per100.carbs, 1, true),
              formatDecimal(per100.fat, 1, true),
            )}
          </AppText>
        </View>
      </Card>

      {servingGrams ? (
        <SegmentedControl
          options={MODE_OPTIONS}
          value={portion.mode}
          onChange={(mode) => setPortion(convertPortion(portion, mode, servingGrams))}
          accessibilityLabel={ro.logFood.unitGroup}
        />
      ) : null}

      <View style={styles.quantity}>
        <AppText variant="label" color="textTertiary">
          {ro.logFood.quantity}
        </AppText>
        <Stepper
          value={portion.amount}
          onChange={(amount) => setPortion({ ...portion, amount })}
          step={range.step}
          min={range.min}
          max={range.max}
          format={formatAmount}
          unit={portionUnit(portion, food.servingName)}
          accessibilityLabel={ro.logFood.quantity}
        />
      </View>

      <View style={styles.meals} accessibilityLabel={ro.logFood.mealGroup}>
        {MEALS.map((m) => (
          <Chip
            key={m}
            testID={`log-meal-${m}`}
            label={ro.meals[m]}
            selected={meal === m}
            onPress={() => setMeal(m)}
            style={styles.mealChip}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      {food.source === 'off' ? (
        <AppText variant="caption" color="textSecondary" testID="log-attribution">
          {ro.addFood.attribution}
        </AppText>
      ) : null}

      <Button
        testID="log-save"
        label={ro.logFood.save(ro.meals[meal], kcal)}
        onPress={() => void save()}
        disabled={saving}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  header: {
    height: size.iconButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: { width: size.iconButton },
  notFound: { gap: space.xs },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  foodText: { flex: 1, gap: space.xxs },
  nutrition: { gap: space.s },
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  kcalUnit: { flexShrink: 1 },
  macros: { flexDirection: 'row', gap: space.xs },
  per100: {
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.divider,
    paddingTop: space.s,
  },
  quantity: { gap: space.xs },
  meals: { flexDirection: 'row', gap: space.xs },
  mealChip: { flex: 1, paddingHorizontal: 0 },
  spacer: { flex: 1 },
});
