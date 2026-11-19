import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import {
  Flame,
  Info,
  Nut,
  Plus,
  Salad,
  ScanBarcode,
  Search,
  Soup,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  EmptyMealRow,
  Fab,
  HeroCard,
  MacroCard,
  MealRow,
  ProgressBar,
  Screen,
  Snackbar,
  SwipeableEntryRow,
  type ThumbTint,
} from '@/components';
import { useUndoSnackbar } from '@/hooks/useUndoSnackbar';
import { strings } from '@/i18n';
import { formatDateLong, toDateKey } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { daySummary, greetingFor } from '@/lib/home';
import type { LogEntryWithFood } from '@/db';
import { defaultMealFor, MEALS, mealFoodNames, totalsByMeal } from '@/lib/meals';
import { macroGoals, sumNutrients } from '@/lib/nutrition';
import { useLogStore } from '@/stores/log';
import { useProfileStore } from '@/stores/profile';
import {
  borderWidth,
  colors,
  decor,
  iconStroke,
  layout,
  opacity,
  radius,
  shadow,
  size,
  space,
} from '@/theme';
import type { Meal } from '@/types/models';

const MEAL_THUMBS: Record<Meal, { tint: ThumbTint; icon: LucideIcon }> = {
  breakfast: { tint: 'berry', icon: Soup },
  lunch: { tint: 'green', icon: Salad },
  dinner: { tint: 'blue', icon: UtensilsCrossed },
  snack: { tint: 'amber', icon: Nut },
};

/** Extra touch area that brings the 28 info icon to a 48 target. */
const INFO_HIT_SLOP = (size.minTouch - size.infoIcon) / 2;

const openAdd = (meal: Meal) => router.push({ pathname: '/add', params: { meal } });

/**
 * Home (Main.html): greeting, hero card, macro cards, meals of the day with their entries,
 * floating add button. Empty day (TodayEmpty.html): "O zi nouă" hero with Scan / Search and
 * empty meal rows. Entries swipe left to delete with a 5 s undo snackbar (TodayDelete.html).
 */
export default function HomeScreen() {
  const entries = useLogStore((s) => s.entries);
  const loaded = useLogStore((s) => s.loaded);
  const load = useLogStore((s) => s.load);
  const remove = useLogStore((s) => s.remove);
  const restore = useLogStore((s) => s.restore);
  const profile = useProfileStore((s) => s.profile);
  const snackbar = useUndoSnackbar();

  const deleteEntry = async (entry: LogEntryWithFood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const removed = await remove(entry.id);
    if (removed) snackbar.show(strings.home.deleted(removed.food.name), () => void restore(removed));
  };

  useFocusEffect(
    useCallback(() => {
      void load(toDateKey(new Date()));
    }, [load]),
  );

  const now = new Date();
  const target = profile?.dailyTargetKcal ?? 0;
  const paused = profile?.paused ?? false;
  const totals = sumNutrients(entries.map((e) => e.nutrients));
  const byMeal = totalsByMeal(entries);
  const goals = macroGoals(target);
  const summary = daySummary(target, totals.kcal);
  const percent = `${formatNumber(summary.percent)}%`;
  const empty = loaded && entries.length === 0;

  return (
    <View style={styles.root}>
      <Screen scroll bottomInset={false} contentStyle={styles.content}>
        <View style={styles.blob} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="h1" accessibilityRole="header">
              {strings.home.greeting[greetingFor(now)]}
            </AppText>
            <AppText variant="body" color="textSecondary">
              {formatDateLong(now)}
            </AppText>
          </View>
          <Pressable
            testID="home-profile"
            onPress={() => router.navigate('/settings')}
            accessibilityRole="button"
            accessibilityLabel={strings.home.profile}
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          >
            <UserRound size={size.iconM} color={colors.brand} strokeWidth={iconStroke.regular} />
          </Pressable>
        </View>

        {empty ? (
          <EmptyDay target={target} paused={paused} />
        ) : (
          <>
            <HeroCard contentStyle={styles.hero} accessibilityLabel={strings.home.caloriesToday}>
              <View style={styles.heroTop}>
                {paused ? (
                  <View style={styles.heroText} testID="home-paused">
                    <AppText variant="h3" color="onBrand">
                      {strings.home.pausedTitle}
                    </AppText>
                    <AppText variant="body" color="heroTextSecondary">
                      {strings.home.pausedBody}
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.heroText}>
                    <View style={styles.heroLabel}>
                      <AppText variant="labelL" color="onBrand">
                        {strings.home.caloriesToday}
                      </AppText>
                      <Pressable
                        testID="home-info"
                        onPress={() => Alert.alert(strings.home.howTitle, strings.home.howBody)}
                        hitSlop={INFO_HIT_SLOP}
                        accessibilityRole="button"
                        accessibilityLabel={strings.home.howCalculated}
                        style={styles.info}
                      >
                        <Info size={size.iconS} color={colors.onBrand} strokeWidth={iconStroke.thin} />
                      </Pressable>
                    </View>
                    <View style={styles.heroNumbers}>
                      <AppText variant="display" color="onBrand" tabular testID="home-food-kcal">
                        {formatNumber(summary.food)}
                      </AppText>
                      <AppText variant="heroUnit" color="heroTextSecondary" tabular>
                        {strings.home.ofTarget(formatNumber(target))}
                      </AppText>
                    </View>
                    <AppText variant="body" color="heroTextSecondary" tabular testID="home-remaining">
                      {summary.over
                        ? strings.home.over(formatNumber(summary.remaining))
                        : strings.home.remaining(formatNumber(summary.remaining))}
                    </AppText>
                  </View>
                )}
                <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Flame size={size.iconL} color={colors.flame} fill={colors.flame} strokeWidth={0} />
                </View>
              </View>
              {paused ? null : (
                <View style={styles.progressRow}>
                  <ProgressBar
                    value={summary.progress}
                    color={colors.lime}
                    trackColor={colors.heroTrack}
                    height={size.progressBarHero}
                    accessibilityLabel={strings.home.progressLabel(percent)}
                    style={styles.progressBar}
                  />
                  <AppText variant="bodyLStrong" color="onBrand" tabular>
                    {percent}
                  </AppText>
                </View>
              )}
            </HeroCard>

            <View style={styles.macros}>
              <MacroCard macro="protein" value={totals.protein} goal={paused ? undefined : goals.protein} />
              <MacroCard macro="carbs" value={totals.carbs} goal={paused ? undefined : goals.carbs} />
              <MacroCard macro="fat" value={totals.fat} goal={paused ? undefined : goals.fat} />
            </View>
          </>
        )}

        <View style={empty ? styles.mealsHeaderEmpty : styles.mealsHeader}>
          <AppText variant="sectionTitle" accessibilityRole="header">
            {strings.home.mealsTitle}
          </AppText>
        </View>
        <View style={empty ? styles.mealsEmpty : styles.meals}>
          {MEALS.map((meal) =>
            empty ? (
              <EmptyMealRow
                key={meal}
                title={strings.meals[meal]}
                subtitle={strings.home.mealEmpty}
                icon={MEAL_THUMBS[meal].icon}
                action={{
                  label: strings.home.add,
                  accessibilityLabel: strings.home.addTo(strings.meals[meal]),
                  onPress: () => openAdd(meal),
                  testID: `home-add-${meal}`,
                }}
              />
            ) : (
              <View key={meal} style={styles.meal}>
                <MealRow
                  testID={`home-meal-${meal}`}
                  title={strings.meals[meal]}
                  subtitle={mealFoodNames(entries, meal) || strings.home.mealEmpty}
                  kcal={byMeal[meal].kcal}
                  tint={MEAL_THUMBS[meal].tint}
                  icon={MEAL_THUMBS[meal].icon}
                  onPress={() => openAdd(meal)}
                />
                {entries
                  .filter((entry) => entry.meal === meal)
                  .map((entry) => (
                    <SwipeableEntryRow
                      key={entry.id}
                      testID={`home-entry-${entry.id}`}
                      title={entry.food.name}
                      subtitle={strings.home.grams(formatNumber(entry.grams))}
                      kcal={entry.nutrients.kcal}
                      tint={MEAL_THUMBS[meal].tint}
                      onDelete={() => void deleteEntry(entry)}
                    />
                  ))}
              </View>
            ),
          )}
        </View>
      </Screen>

      {snackbar.current ? (
        <Snackbar
          testID="home-snackbar"
          message={snackbar.current.message}
          onAction={snackbar.undo}
          style={styles.snackbar}
        />
      ) : empty ? null : (
        <Fab
          testID="home-add"
          label={strings.home.addFood}
          icon={Plus}
          onPress={() => openAdd(defaultMealFor(new Date()))}
          style={styles.fab}
        />
      )}
    </View>
  );
}

/** Hero of an empty day (TodayEmpty.html): full target left and the two ways to log the first food. */
function EmptyDay({ target, paused }: { target: number; paused: boolean }) {
  return (
    <HeroCard contentStyle={styles.hero} accessibilityLabel={strings.home.newDay}>
      <View style={styles.heroTop}>
        {paused ? (
          <View style={styles.heroText} testID="home-paused">
            <AppText variant="h3" color="onBrand">
              {strings.home.pausedTitle}
            </AppText>
            <AppText variant="body" color="heroTextSecondary">
              {strings.home.pausedBody}
            </AppText>
          </View>
        ) : (
          <View style={styles.heroText} testID="home-empty">
            <AppText variant="labelL" color="onBrand">
              {strings.home.newDay}
            </AppText>
            <View style={styles.heroNumbers}>
              <AppText variant="display" color="onBrand" tabular>
                {formatNumber(target)}
              </AppText>
              <AppText variant="heroUnit" color="heroTextSecondary">
                {strings.home.remainingUnit}
              </AppText>
            </View>
            <AppText variant="body" color="heroTextSecondary">
              {strings.home.newDayHint}
            </AppText>
          </View>
        )}
        <View
          style={[styles.badge, styles.badgeSoft]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Flame size={size.iconL} color={colors.lime} fill={colors.lime} strokeWidth={0} />
        </View>
      </View>
      <View style={styles.heroActions}>
        <Pressable
          testID="home-scan"
          onPress={() => router.push('/scan')}
          accessibilityRole="button"
          accessibilityLabel={strings.home.scan}
          style={({ pressed }) => [styles.heroAction, styles.heroActionFilled, pressed && styles.heroActionPressed]}
        >
          <ScanBarcode size={size.iconS} color={colors.brand} strokeWidth={iconStroke.navActive} />
          <AppText variant="button" color="brand">
            {strings.home.scan}
          </AppText>
        </Pressable>
        <Pressable
          testID="home-search"
          onPress={() => openAdd(defaultMealFor(new Date()))}
          accessibilityRole="button"
          accessibilityLabel={strings.home.search}
          style={({ pressed }) => [styles.heroAction, styles.heroActionOutline, pressed && styles.heroActionPressed]}
        >
          <Search size={size.iconS} color={colors.onBrand} strokeWidth={iconStroke.navActive} />
          <AppText variant="button" color="onBrand">
            {strings.home.search}
          </AppText>
        </Pressable>
      </View>
    </HeroCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  // Room below the last meal row so the floating button never covers it.
  content: { paddingBottom: size.fab + space.m * 2 },
  blob: {
    position: 'absolute',
    top: decor.homeBlob.top,
    right: decor.homeBlob.right,
    width: decor.homeBlob.width,
    height: decor.homeBlob.height,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s },
  headerText: { flex: 1, gap: space.xxs },
  avatar: {
    width: size.avatar,
    height: size.avatar,
    borderRadius: radius.pill,
    borderWidth: borderWidth.avatar,
    borderColor: colors.surface,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatarPressed: { backgroundColor: colors.mint },
  hero: { padding: layout.cardPadding, gap: space.m },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s },
  heroText: { flex: 1, gap: space.xs },
  heroLabel: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  info: { width: size.infoIcon, height: size.infoIcon, alignItems: 'center', justifyContent: 'center' },
  heroNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  badge: {
    width: size.heroBadge,
    height: size.heroBadge,
    borderRadius: radius.pill,
    backgroundColor: colors.flameCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  progressBar: { flex: 1 },
  macros: { flexDirection: 'row', gap: space.s },
  mealsHeader: {
    minHeight: size.minTouch,
    marginTop: space.xxs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealsHeaderEmpty: { marginTop: space.xxs },
  meals: { gap: layout.listGap, marginTop: -space.xs },
  mealsEmpty: { gap: layout.listGap },
  meal: { gap: layout.listGap },
  fab: { position: 'absolute', right: layout.screenPaddingX, bottom: space.m },
  snackbar: {
    position: 'absolute',
    left: layout.screenPaddingX,
    right: layout.screenPaddingX,
    bottom: space.m,
  },
  badgeSoft: { backgroundColor: colors.heroBadgeSoft },
  heroActions: { flexDirection: 'row', gap: space.s },
  heroAction: {
    flex: 1,
    height: size.chip,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  heroActionFilled: { backgroundColor: colors.surface },
  heroActionOutline: { borderWidth: borderWidth.strong, borderColor: colors.heroOutline },
  heroActionPressed: { opacity: opacity.pressed },
});
