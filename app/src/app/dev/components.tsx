import { ChevronLeft, Coffee, Plus, Salad, Soup } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  FoodThumb,
  IconButton,
  MacroCard,
  MealRow,
  ProgressBar,
  Screen,
  SegmentedControl,
  Snackbar,
  Stepper,
  TextField,
  type TextVariant,
} from '@/components';
import { strings } from '@/i18n';
import { borderWidth, colors, macros, radius, size, space, type } from '@/theme';

const t = strings.dev.samples;
const sections = strings.dev.sections;

const typeSamples = () =>
  Object.entries(strings.dev.typeSamples).map(([variant, sample]) => ({
  variant: variant as TextVariant,
  sample,
}));

const spaceSamples = Object.entries(space) as [string, number][];
const radiusSamples = [radius.s, radius.m, radius.l];

type Unit = 'g' | 's';
type MealKey = keyof typeof strings.meals;

/** Dev-only screen: every core component, grouped like design/screens/System.html. */
export default function ComponentsScreen() {
  const [unit, setUnit] = useState<Unit>('g');
  const [meal, setMeal] = useState<MealKey>('breakfast');
  const [amount, setAmount] = useState(250);
  const [weight, setWeight] = useState('72,4');
  const [name, setName] = useState('');
  const [snackMessage, setSnackMessage] = useState<string>(t.deleted);

  return (
    <Screen scroll gap={space.l}>
      <View style={styles.header}>
        <IconButton
          icon={ChevronLeft}
          iconSize="S"
          accessibilityLabel={strings.common.back}
          onPress={() => router.back()}
        />
        <AppText variant="h1">{strings.dev.components}</AppText>
      </View>

      <Section title={sections.text}>
        {typeSamples().map(({ variant, sample }) => (
          <Row key={variant} note={`${variant} · ${type[variant].fontSize}/${type[variant].lineHeight}`}>
            <AppText variant={variant} tabular numberOfLines={1} style={styles.shrink}>
              {sample}
            </AppText>
          </Row>
        ))}
        {spaceSamples.map(([key, value]) => (
          <Row key={key} note={`${value} pt`}>
            <View style={[styles.swatch, { width: value }]} />
          </Row>
        ))}
      </Section>

      <Section title={sections.buttons}>
        <Button label={t.primary} onPress={() => {}} icon={Plus} />
        <Button label={t.secondary} variant="outline" onPress={() => {}} />
        <Button label={t.text} variant="text" onPress={() => {}} />
        <Button label={t.disabled} disabled onPress={() => {}} />
      </Section>

      <Section title={sections.chips}>
        <View style={styles.chipGrid}>
          {(Object.keys(strings.meals) as MealKey[]).map((key) => (
            <Chip
              key={key}
              label={strings.meals[key]}
              selected={meal === key}
              onPress={() => setMeal(key)}
              style={styles.flex}
            />
          ))}
        </View>
        <View style={styles.wrapRow}>
          <Chip label={t.chip} variant="action" onPress={() => {}} />
          <Chip label={t.add} variant="action" icon={Plus} onPress={() => {}} />
        </View>
      </Section>

      <Section title={sections.fields}>
        <TextField
          label={t.weight}
          value={weight}
          onChangeText={setWeight}
          suffix={strings.common.kg}
          keyboardType="decimal-pad"
        />
        <TextField label={t.height} defaultValue="172" suffix={strings.common.cm} keyboardType="number-pad" />
        <TextField
          label={t.name}
          value={name}
          onChangeText={setName}
          error={name.trim() ? undefined : t.nameError}
        />
      </Section>

      <Section title={sections.segmented}>
        <SegmentedControl<Unit>
          options={[
            { value: 'g', label: t.grams },
            { value: 's', label: t.servings },
          ]}
          value={unit}
          onChange={setUnit}
        />
      </Section>

      <Section title={sections.stepper}>
        <AppText variant="label" color="textTertiary">
          {t.quantity}
        </AppText>
        <Stepper value={amount} onChange={setAmount} step={10} min={5} unit={strings.common.grams} />
      </Section>

      <Section title={sections.progress}>
        <ProgressBar value={0.42} />
        <ProgressBar value={0.41} color={macros.protein.bar} trackColor={macros.protein.tint} />
        <ProgressBar value={1.3} color={macros.carbs.bar} trackColor={macros.carbs.tint} />
        <View style={styles.heroBar}>
          <ProgressBar
            value={0.42}
            color={colors.lime}
            trackColor={colors.scanButton}
            height={size.progressBarHero}
          />
        </View>
      </Section>

      <Section title={sections.macros}>
        <View style={styles.macroRow}>
          <MacroCard macro="protein" value={62} goal={150} />
          <MacroCard macro="carbs" value={98} goal={250} />
          <MacroCard macro="fat" value={28} goal={70} />
        </View>
      </Section>

      <Section title={sections.thumbs}>
        <View style={styles.wrapRow}>
          <FoodThumb tint="berry" icon={Coffee} />
          <FoodThumb tint="green" icon={Salad} />
          <FoodThumb tint="amber" icon={Soup} />
          <FoodThumb tint="blue" name={t.yogurt} />
          <FoodThumb tint="berry" name={t.banana} size="s" />
          <FoodThumb tint="green" icon={Salad} size="s" />
        </View>
      </Section>

      <Section title={sections.mealRows}>
        <View style={styles.list}>
          <MealRow
            title={strings.meals.breakfast}
            subtitle={t.breakfastItems}
            kcal={320}
            tint="berry"
            icon={Coffee}
            onPress={() => {}}
          />
          <MealRow
            title={strings.meals.lunch}
            subtitle={t.lunchItems}
            kcal={420}
            tint="green"
            icon={Salad}
            onPress={() => {}}
          />
          <MealRow title={strings.meals.dinner} subtitle={t.dinnerItems} kcal={1250} tint="amber" icon={Soup} />
        </View>
      </Section>

      <Section title={sections.iconButtons}>
        <View style={styles.wrapRow}>
          <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} variant="surface" iconSize="S" />
          <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} variant="outline" />
          <IconButton icon={Plus} accessibilityLabel={strings.common.more} variant="soft" />
          <IconButton icon={Plus} accessibilityLabel={strings.common.more} variant="mint" />
          <View style={styles.darkTile}>
            <IconButton icon={Plus} accessibilityLabel={strings.common.more} variant="dark" />
          </View>
        </View>
      </Section>

      <Section title={sections.cards}>
        <Card>
          <AppText>{t.card}</AppText>
        </Card>
        <View style={styles.wrapRow}>
          {radiusSamples.map((r) => (
            <View key={r} style={[styles.radiusSample, { borderRadius: r }]} />
          ))}
          <View style={[styles.radiusSample, { borderRadius: radius.pill }]} />
        </View>
      </Section>

      <Section title={sections.snackbar}>
        <Snackbar message={snackMessage} onAction={() => setSnackMessage(t.undone)} />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" color="textSecondary">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Row({ note, children }: { note: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      {children}
      <AppText variant="caption" color="textSecondary" tabular>
        {note}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  section: { gap: space.s },
  row: {
    minHeight: size.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.m,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.divider,
  },
  shrink: { flexShrink: 1 },
  swatch: { height: space.m, borderRadius: radius.xs, backgroundColor: colors.chartBar },
  chipGrid: { flexDirection: 'row', gap: space.xs },
  flex: { flex: 1, paddingHorizontal: 0 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
  heroBar: { backgroundColor: colors.heroFrom, borderRadius: radius.l, padding: space.m },
  macroRow: { flexDirection: 'row', gap: space.s },
  list: { gap: space.xs },
  darkTile: { backgroundColor: colors.scanBackground, borderRadius: radius.m, padding: space.xxs },
  radiusSample: { width: size.thumbSmall, height: size.thumbSmall, backgroundColor: colors.mint },
});
