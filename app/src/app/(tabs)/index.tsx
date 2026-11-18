import { router, useFocusEffect } from 'expo-router';
import {
  Flame,
  Info,
  Nut,
  Plus,
  Salad,
  Soup,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Fab,
  HeroCard,
  MacroCard,
  MealRow,
  ProgressBar,
  Screen,
  type ThumbTint,
} from '@/components';
import ro from '@/i18n/ro';
import { formatDateLong, toDateKey } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { daySummary, greetingFor } from '@/lib/home';
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

/** Home (Main.html): greeting, hero card, macro cards, meals of the day, floating add button. */
export default function HomeScreen() {
  const entries = useLogStore((s) => s.entries);
  const load = useLogStore((s) => s.load);
  const profile = useProfileStore((s) => s.profile);

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

  return (
    <View style={styles.root}>
      <Screen scroll bottomInset={false} contentStyle={styles.content}>
        <View style={styles.blob} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="h1" accessibilityRole="header">
              {ro.home.greeting[greetingFor(now)]}
            </AppText>
            <AppText variant="body" color="textSecondary">
              {formatDateLong(now)}
            </AppText>
          </View>
          <Pressable
            testID="home-profile"
            onPress={() => router.navigate('/settings')}
            accessibilityRole="button"
            accessibilityLabel={ro.home.profile}
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          >
            <UserRound size={size.iconM} color={colors.brand} strokeWidth={iconStroke.regular} />
          </Pressable>
        </View>

        <HeroCard contentStyle={styles.hero} accessibilityLabel={ro.home.caloriesToday}>
          <View style={styles.heroTop}>
            {paused ? (
              <View style={styles.heroText} testID="home-paused">
                <AppText variant="h3" color="onBrand">
                  {ro.home.pausedTitle}
                </AppText>
                <AppText variant="body" color="heroTextSecondary">
                  {ro.home.pausedBody}
                </AppText>
              </View>
            ) : (
              <View style={styles.heroText}>
                <View style={styles.heroLabel}>
                  <AppText variant="labelL" color="onBrand">
                    {ro.home.caloriesToday}
                  </AppText>
                  <Pressable
                    testID="home-info"
                    onPress={() => Alert.alert(ro.home.howTitle, ro.home.howBody)}
                    hitSlop={INFO_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityLabel={ro.home.howCalculated}
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
                    {ro.home.ofTarget(formatNumber(target))}
                  </AppText>
                </View>
                <AppText variant="body" color="heroTextSecondary" tabular testID="home-remaining">
                  {summary.over
                    ? ro.home.over(formatNumber(summary.remaining))
                    : ro.home.remaining(formatNumber(summary.remaining))}
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
                accessibilityLabel={ro.home.progressLabel(percent)}
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

        <View style={styles.mealsHeader}>
          <AppText variant="sectionTitle" accessibilityRole="header">
            {ro.home.mealsTitle}
          </AppText>
        </View>
        <View style={styles.meals}>
          {MEALS.map((meal) => (
            <MealRow
              key={meal}
              testID={`home-meal-${meal}`}
              title={ro.meals[meal]}
              subtitle={mealFoodNames(entries, meal) || ro.home.mealEmpty}
              kcal={byMeal[meal].kcal}
              tint={MEAL_THUMBS[meal].tint}
              icon={MEAL_THUMBS[meal].icon}
              onPress={() => openAdd(meal)}
            />
          ))}
        </View>
      </Screen>

      <Fab
        testID="home-add"
        label={ro.home.addFood}
        icon={Plus}
        onPress={() => openAdd(defaultMealFor(new Date()))}
        style={styles.fab}
      />
    </View>
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
  meals: { gap: layout.listGap, marginTop: -space.xs },
  fab: { position: 'absolute', right: layout.screenPaddingX, bottom: space.m },
});
