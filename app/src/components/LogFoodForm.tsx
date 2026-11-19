import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { strings } from '@/i18n';
import { formatDecimal, formatNumber } from '@/lib/format';
import { MEALS } from '@/lib/meals';
import { macroGoals, nutrientsFor } from '@/lib/nutrition';
import {
  convertPortion,
  formatAmount,
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
import { useProfileStore } from '@/stores/profile';
import { borderWidth, colors, size, space } from '@/theme';
import type { Food, Meal } from '@/types/models';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { FoodThumb } from './FoodThumb';
import { IconButton } from './IconButton';
import { MacroCard } from './MacroCard';
import { Screen } from './Screen';
import { SegmentedControl, type SegmentOption } from './SegmentedControl';
import { Stepper } from './Stepper';

const MODE_OPTIONS: readonly SegmentOption<PortionMode>[] = [
  { value: 'grams', get label() { return strings.logFood.grams; } },
  { value: 'servings', get label() { return strings.logFood.servings; } },
];

const MACRO_KEYS = ['protein', 'carbs', 'fat'] as const;

/** Header shared by Log food and Product found: back button, centered title. */
export function FlowHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <IconButton
        testID="log-back"
        icon={ChevronLeft}
        iconSize="S"
        accessibilityLabel={strings.common.back}
        onPress={onBack}
      />
      <AppText variant="bodyLStrong" accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export interface LogFoodFormProps {
  food: Food;
  /** Header title ("Adaugă în jurnal", "Produs găsit"). */
  title: string;
  /** Line under the food name. */
  subtitle: string;
  initialMeal: Meal;
  onBack: () => void;
  /** Saves the entry; the form stays disabled while it runs and re-enables if it throws. */
  onSave: (meal: Meal, grams: number) => Promise<void>;
  /** 'l' = 64 round thumb (Log food), 'xl' = 72 product tile (Product found). */
  thumbSize?: 'l' | 'xl';
  /** Data attribution: above the save button (Log food) or centered below it (Product found). */
  attribution?: { text: string; position: 'above' | 'below' };
  /** Vertical gap between sections (Log food 16, Product found 12). */
  gap?: number;
  /** Status-bar inset: off inside a page sheet (Log food), on in the full-screen scan flow. */
  topInset?: boolean;
}

/**
 * Amount in grams or servings, live calories and macros, meal choice and the
 * "Adaugă la <masă> · x kcal" button (LogFood.html, ProductFound.html).
 */
export function LogFoodForm({
  food,
  title,
  subtitle,
  initialMeal,
  onBack,
  onSave,
  thumbSize = 'l',
  attribution,
  gap = space.m,
  topInset = false,
}: LogFoodFormProps) {
  const [portion, setPortion] = useState<Portion>(() => initialPortion(food));
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [saving, setSaving] = useState(false);
  const profile = useProfileStore((s) => s.profile);

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
      await onSave(meal, grams);
    } catch {
      // Saving locally practically never fails; let the user try again.
      setSaving(false);
    }
  };

  const attributionText = (position: 'above' | 'below') =>
    attribution?.position === position ? (
      <AppText
        variant={position === 'below' ? 'footnote' : 'caption'}
        color="textSecondary"
        align={position === 'below' ? 'center' : undefined}
        testID="log-attribution"
      >
        {attribution.text}
      </AppText>
    ) : null;

  return (
    <Screen scroll topInset={topInset} gap={gap} contentStyle={styles.content}>
      <FlowHeader title={title} onBack={onBack} />

      <View style={styles.foodRow}>
        <FoodThumb size={thumbSize} tint={thumbTintFor(food.id)} name={food.name} />
        <View style={styles.foodText}>
          <AppText variant="sectionTitle" testID="log-name">
            {food.name}
          </AppText>
          <AppText variant="body" color="textSecondary" testID="log-subtitle">
            {subtitle}
          </AppText>
        </View>
      </View>

      <Card style={styles.nutrition}>
        <View accessibilityLabel={strings.logFood.nutritionLabel} style={styles.kcalRow}>
          <AppText variant="numberL" tabular testID="log-kcal">
            {kcal}
          </AppText>
          <AppText variant="labelL" color="textSecondary" style={styles.kcalUnit}>
            {strings.logFood.kcalFor(
              portion.mode === 'grams'
                ? `${formatAmount(grams)} ${strings.common.grams}`
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
            {strings.logFood.per100(
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
          accessibilityLabel={strings.logFood.unitGroup}
        />
      ) : null}

      <View style={styles.quantity}>
        <AppText variant="label" color="textTertiary">
          {strings.logFood.quantity}
        </AppText>
        <Stepper
          value={portion.amount}
          onChange={(amount) => setPortion({ ...portion, amount })}
          step={range.step}
          min={range.min}
          max={range.max}
          format={formatAmount}
          unit={portionUnit(portion, food.servingName)}
          accessibilityLabel={strings.logFood.quantity}
        />
      </View>

      <View style={styles.meals} accessibilityLabel={strings.logFood.mealGroup}>
        {MEALS.map((m) => (
          <Chip
            key={m}
            testID={`log-meal-${m}`}
            label={strings.meals[m]}
            selected={meal === m}
            onPress={() => setMeal(m)}
            style={styles.mealChip}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      {attributionText('above')}

      <Button
        testID="log-save"
        label={strings.logFood.save(strings.meals[meal], kcal)}
        onPress={() => void save()}
        disabled={saving}
      />

      {attributionText('below')}
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
