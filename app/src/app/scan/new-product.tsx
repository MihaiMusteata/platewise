import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, FlowHeader, Screen, TextField } from '@/components';
import { getDb, upsertFood } from '@/db';
import { strings } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { defaultMealFor, isMeal } from '@/lib/meals';
import {
  BRAND_MAX,
  buildCustomFood,
  EMPTY_PRODUCT_FORM,
  NAME_MAX,
  validateProductForm,
  type ProductField,
  type ProductFormValues,
} from '@/lib/productForm';
import { defaultGrams } from '@/lib/search';
import { useLogStore } from '@/stores/log';
import { space } from '@/theme';
import type { Meal } from '@/types/models';

/** The barcode param comes from the scan flow (already checked); keep only plain digit codes. */
const BARCODE_PATTERN = /^\d{8,14}$/;

type NumberField = Exclude<ProductField, 'name' | 'brand'>;

/** Two-column rows under the full-width name, in AddProduct.html order. */
const ROWS: readonly [ProductField, ProductField][] = [
  ['brand', 'servingGrams'],
  ['kcal', 'protein'],
  ['carbs', 'fat'],
];

const LABELS: Record<ProductField, string> = {
  get name() {
    return strings.addProduct.name;
  },
  get brand() {
    return strings.addProduct.brand;
  },
  get servingGrams() {
    return strings.addProduct.serving;
  },
  get kcal() {
    return strings.addProduct.kcal;
  },
  get protein() {
    return strings.addProduct.protein;
  },
  get carbs() {
    return strings.addProduct.carbs;
  },
  get fat() {
    return strings.addProduct.fat;
  },
};

const isNumberField = (field: ProductField): field is NumberField =>
  field !== 'name' && field !== 'brand';

/**
 * Add product from label (AddProduct.html): name, brand, serving and per-100 g values.
 * Saves a `custom` food (with the scanned barcode, if any), logs one serving (or 100 g) to the
 * meal param or the current meal, and closes the flow on Home.
 */
export default function NewProductScreen() {
  const params = useLocalSearchParams<{ barcode?: string; meal?: string }>();
  const barcode =
    typeof params.barcode === 'string' && BARCODE_PATTERN.test(params.barcode) ? params.barcode : undefined;
  const [meal] = useState<Meal>(() =>
    isMeal(params.meal) ? params.meal : defaultMealFor(new Date()),
  );
  const [values, setValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [saving, setSaving] = useState(false);
  const result = useMemo(() => validateProductForm(values), [values]);

  const set = (field: ProductField) => (text: string) =>
    setValues((current) => ({ ...current, [field]: text }));

  const save = async () => {
    if (!result.data || saving) return;
    setSaving(true);
    try {
      const food = buildCustomFood(result.data, barcode);
      const db = await getDb();
      await upsertFood(db, food);
      await useLogStore.getState().add({ meal, foodId: food.id, grams: defaultGrams(food) });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      // Close the whole flow (scan modal, and search under it) and land on Home.
      router.dismissTo('/');
    } catch {
      // Saving locally practically never fails; let the user try again.
      setSaving(false);
    }
  };

  const field = (key: ProductField) => {
    const error = result.errors[key];
    const numeric = isNumberField(key);
    return (
      <View key={key} style={key === 'name' ? undefined : styles.half}>
        <TextField
          testID={`product-${key}`}
          label={LABELS[key]}
          value={values[key]}
          onChangeText={set(key)}
          error={error ? strings.addProduct.errors[error] : undefined}
          keyboardType={numeric ? 'decimal-pad' : 'default'}
          autoCapitalize={numeric ? 'none' : 'sentences'}
          autoCorrect={false}
          maxLength={numeric ? 7 : key === 'name' ? NAME_MAX : BRAND_MAX}
          returnKeyType="done"
        />
      </View>
    );
  };

  return (
    <Screen scroll topInset contentStyle={styles.content}>
      <FlowHeader title={strings.addProduct.header} onBack={() => router.back()} />

      <View style={styles.titleBlock}>
        <AppText variant="h2" accessibilityRole="header">
          {strings.addProduct.title}
        </AppText>
        <AppText variant="body" color="textSecondary" tabular testID="product-subtitle">
          {barcode ? strings.addProduct.subtitleWithCode(barcode) : strings.addProduct.subtitle}
        </AppText>
      </View>

      <View style={styles.grid}>
        {field('name')}
        {ROWS.map(([left, right]) => (
          <View key={left} style={styles.row}>
            {field(left)}
            {field(right)}
          </View>
        ))}
      </View>

      {result.macroSumError ? (
        <AppText variant="caption" color="attention" testID="product-macro-sum">
          {strings.addProduct.errors.macroSum}
        </AppText>
      ) : null}
      {result.kcalMismatch ? (
        <AppText
          variant="caption"
          color="attention"
          testID="product-kcal-hint"
          accessibilityLiveRegion="polite"
        >
          {strings.addProduct.kcalMismatch(formatNumber(result.kcalEstimate))}
        </AppText>
      ) : null}

      <View style={styles.spacer} />

      <Button
        testID="product-save"
        label={strings.addProduct.save}
        onPress={() => void save()}
        disabled={!result.valid || saving}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  titleBlock: { gap: space.xs },
  grid: { gap: space.s },
  row: { flexDirection: 'row', gap: space.s, alignItems: 'flex-start' },
  half: { flex: 1, minWidth: 0 },
  spacer: { flex: 1 },
});
