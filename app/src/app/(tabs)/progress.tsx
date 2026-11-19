import { router, useFocusEffect } from 'expo-router';
import { ChartNoAxesColumn, ChevronRight, Leaf, Pause, Scale, Trophy } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, CalorieChart, Card, MacroDonut, ProgressBar, Screen, SegmentedControl } from '@/components';
import { dailyTotals, getDb } from '@/db';
import { strings } from '@/i18n';
import { formatDecimal, formatNumber } from '@/lib/format';
import {
  averageKcal,
  buildBars,
  chartMax,
  macroShare,
  periodRange,
  weeklyGoal,
  type Bar,
  type DayTotals,
  type Period,
} from '@/lib/progress';
import { useLogStore } from '@/stores/log';
import { useProfileStore } from '@/stores/profile';
import { colors, decor, iconStroke, layout, opacity, radius, size, space } from '@/theme';

const PERIODS: readonly { value: Period; label: string }[] = [
  { value: 'week', get label() { return strings.progress.periods.week; } },
  { value: 'month', get label() { return strings.progress.periods.month; } },
  { value: 'year', get label() { return strings.progress.periods.year; } },
];

interface Data {
  today: Date;
  period: Period;
  totals: DayTotals[];
  /** Always the current Monday–Sunday week (weekly goal card). */
  week: DayTotals[];
}

const currentKey = (bars: Bar[]) => bars.find((b) => b.isCurrent)?.key;

/**
 * Progress (Progress.html): period segments, calorie chart with goal line and tooltip, weekly
 * goal card, macro distribution donut and the weight card.
 */
export default function ProgressScreen() {
  const revision = useLogStore((s) => s.revision);
  const profile = useProfileStore((s) => s.profile);
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<Data | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>();

  const request = useRef(0);

  const load = useCallback(async (p: Period) => {
    const id = ++request.current;
    const today = new Date();
    const db = await getDb();
    const range = periodRange(p, today);
    const totals = await dailyTotals(db, range.from, range.to);
    let week = totals;
    if (p !== 'week') {
      const w = periodRange('week', today);
      week = await dailyTotals(db, w.from, w.to);
    }
    // Ignore answers to older requests (fast segment switches, log changes).
    if (id === request.current) setData({ today, period: p, totals, week });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(period);
    }, [load, period]),
  );

  // Reload when the log changes while this tab stays mounted.
  useEffect(() => {
    if (revision > 0) void load(period);
  }, [revision, load, period]);

  const changePeriod = (next: Period) => {
    setPeriod(next);
    setSelectedKey(undefined);
  };

  const target = profile?.dailyTargetKcal ?? 0;
  const paused = profile?.paused ?? false;
  const ready = data !== null && data.period === period;
  const totals = ready ? data.totals : [];
  const bars = ready ? buildBars(period, totals, data.today) : [];
  const goalLine = paused ? undefined : target;
  const max = chartMax(bars, goalLine ?? 0);
  const average = averageKcal(totals);
  const selected = selectedKey && bars.some((b) => b.key === selectedKey) ? selectedKey : currentKey(bars);
  const weekly = weeklyGoal(data?.week ?? [], target);
  const weeklyPercent = `${Math.round(weekly.ratio * 100)}%`;

  const chartLabel = [
    `${strings.progress.chartLabel[period]}: ${bars.map((b) => `${b.label} ${formatNumber(b.kcal)}`).join(', ')}.`,
    goalLine ? strings.progress.chartGoal(formatNumber(goalLine)) : '',
  ]
    .join(' ')
    .trim();

  return (
    <Screen scroll bottomInset={false} gap={space.s}>
      <View style={styles.blob} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />

      <View style={styles.header}>
        <AppText variant="h1" accessibilityRole="header">
          {strings.progress.title}
        </AppText>
      </View>

      <SegmentedControl
        size="l"
        options={PERIODS}
        value={period}
        onChange={changePeriod}
        accessibilityLabel={strings.progress.periodGroup}
      />

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitle}>
            <ChartNoAxesColumn size={size.iconS} color={colors.brand} strokeWidth={iconStroke.bold} />
            <AppText variant="bodyLStrong">{strings.progress.caloriesTitle}</AppText>
          </View>
          <AppText variant="body" color="textSecondary" testID="progress-average">
            {strings.progress.average}
            <AppText variant="bodyStrong" tabular>
              {strings.progress.kcal(formatNumber(average))}
            </AppText>
          </AppText>
        </View>
        <CalorieChart
          period={period}
          bars={bars}
          max={max}
          goal={goalLine}
          selectedKey={selected}
          onSelect={setSelectedKey}
          accessibilityLabel={chartLabel}
        />
      </Card>

      {paused ? (
        <View style={styles.weekly} testID="progress-paused">
          <View style={[styles.weeklyBadge, styles.pausedBadge]}>
            <Pause size={size.iconM} color={colors.brand} strokeWidth={iconStroke.regular} />
          </View>
          <View style={styles.weeklyText}>
            <AppText variant="label" color="textTertiary">
              {strings.progress.pausedTitle}
            </AppText>
            <AppText variant="body" color="textSecondary">
              {strings.progress.pausedBody}
            </AppText>
          </View>
        </View>
      ) : (
        <View
          style={styles.weekly}
          testID="progress-weekly"
          accessible
          accessibilityLabel={`${strings.progress.weeklyTitle}. ${strings.progress.weeklyLabel(
            formatNumber(weekly.consumed),
            formatNumber(weekly.goal),
            weeklyPercent,
          )}`}
        >
          <View style={styles.weeklyBadge}>
            <Trophy size={size.iconM} color={colors.trophy} strokeWidth={iconStroke.regular} />
          </View>
          <View style={styles.weeklyText}>
            <AppText variant="label" color="textTertiary">
              {strings.progress.weeklyTitle}
            </AppText>
            <View style={styles.weeklyNumbers}>
              <AppText variant="body" color="textSecondary" tabular testID="progress-weekly-value">
                <AppText variant="sectionTitle" tabular>
                  {formatNumber(weekly.consumed)}
                </AppText>
                {strings.progress.weeklyOf(formatNumber(weekly.goal))}
              </AppText>
              <AppText variant="numberS" tabular testID="progress-weekly-percent">
                {weeklyPercent}
              </AppText>
            </View>
            <ProgressBar
              value={weekly.ratio}
              color={colors.brand}
              trackColor={colors.weeklyTrack}
              height={size.progressBarWeekly}
            />
          </View>
        </View>
      )}

      <AppText variant="sectionTitle" accessibilityRole="header" style={styles.macrosTitle}>
        {strings.progress.macrosTitle}
      </AppText>
      <View style={styles.donut}>
        <MacroDonut share={macroShare(totals)} averageKcal={average} />
      </View>

      <Pressable
        testID="progress-weight"
        onPress={() => router.navigate('/settings')}
        accessibilityRole="link"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card rounded="m" padded={false} style={styles.weight}>
          <View style={styles.weightBadge}>
            {profile?.weightTracking ? (
              <Scale size={size.iconS} color={colors.brand} strokeWidth={iconStroke.regular} />
            ) : (
              <Leaf size={size.iconS} color={colors.brand} strokeWidth={iconStroke.regular} />
            )}
          </View>
          <View style={styles.weightText}>
            <AppText variant="bodyStrong">
              {profile?.weightTracking && profile.weightKg > 0
                ? strings.progress.weightOnTitle(formatDecimal(profile.weightKg, 1, true))
                : strings.progress.weightOffTitle}
            </AppText>
            <AppText variant="footnote" color="textSecondary">
              {profile?.weightTracking ? strings.progress.weightOnBody : strings.progress.weightOffBody}
            </AppText>
          </View>
          <ChevronRight size={size.iconS} color={colors.chevron} strokeWidth={iconStroke.regular} />
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    top: decor.homeBlob.top,
    right: decor.homeBlob.right,
    width: decor.homeBlob.width,
    height: decor.homeBlob.height,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  header: { minHeight: size.minTouch, flexDirection: 'row', alignItems: 'center' },
  chartCard: { gap: space.s },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.xs },
  chartTitle: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  weekly: {
    backgroundColor: colors.mintSoft,
    borderRadius: radius.l,
    padding: layout.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  weeklyBadge: {
    width: size.avatar,
    height: size.avatar,
    borderRadius: radius.pill,
    backgroundColor: colors.trophyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedBadge: { backgroundColor: colors.mint },
  weeklyText: { flex: 1, gap: space.xxs },
  weeklyNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  macrosTitle: { marginTop: space.xxs },
  donut: { marginTop: -space.xxs },
  weight: {
    paddingVertical: space.s,
    paddingHorizontal: layout.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  weightBadge: {
    width: size.rowBadge,
    height: size.rowBadge,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightText: { flex: 1 },
  pressed: { opacity: opacity.pressed },
});
