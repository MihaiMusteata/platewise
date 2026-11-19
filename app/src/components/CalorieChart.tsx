import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { strings } from '@/i18n';
import {
  axisLabel,
  axisTicks,
  barHeight,
  barPath,
  barSlots,
  clampedLeft,
  showDayLabel,
} from '@/lib/chartGeometry';
import { formatNumber } from '@/lib/format';
import type { Bar, Period } from '@/lib/progress';
import { chart, colors, radius, shadow, space, type } from '@/theme';

import { AppText } from './AppText';

export interface CalorieChartProps {
  period: Period;
  bars: Bar[];
  /** Axis maximum (from `chartMax`). */
  max: number;
  /** Daily target for the dashed goal line; omit to hide it (paused tracking). */
  goal?: number;
  selectedKey?: string;
  onSelect: (key: string) => void;
  accessibilityLabel: string;
}

const GAP: Record<Period, number> = {
  week: chart.barGapWeek,
  month: chart.barGapMonth,
  year: chart.barGapYear,
};

/** Tooltip box height: 8 + 20 line + 8. */
const TOOLTIP_HEIGHT = space.xs * 2 + type.bodyStrong.lineHeight;

/**
 * Bar chart of kcal per day (week, month) or average per month (year) with horizontal grid,
 * dashed goal line and a tooltip on the selected bar (Progress.html). Bars above the goal keep
 * their normal colors; the current day/month is highlighted.
 */
export function CalorieChart({
  period,
  bars,
  max,
  goal,
  selectedKey,
  onSelect,
  accessibilityLabel,
}: CalorieChartProps) {
  const [width, setWidth] = useState(0);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const height = chart.height;
  const slots = barSlots(bars.length, width, GAP[period], chart.barPadding);
  const ticks = axisTicks(max);
  const selectedIndex = bars.findIndex((b) => b.key === selectedKey);
  const selected = selectedIndex >= 0 ? bars[selectedIndex] : undefined;
  const selectedSlot = selectedIndex >= 0 ? slots[selectedIndex] : undefined;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const y = (value: number) => height - barHeight(value, max, height);

  const isMonth = period === 'month';
  const current = bars.find((b) => b.isCurrent);
  const currentDay = isMonth && current ? Number(current.label) : undefined;
  const labelWidth = (slotWidth: number) => (isMonth ? chart.monthLabelWidth : slotWidth);

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View
          style={styles.axis}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {ticks.map((tick) => (
            <AppText key={tick} variant="footnote" color="textSecondary" align="right" tabular>
              {axisLabel(tick)}
            </AppText>
          ))}
        </View>

        <View
          testID="calorie-chart"
          style={styles.plot}
          onLayout={onLayout}
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
        >
          {width > 0 ? (
            <Svg width={width} height={height}>
              {ticks
                .filter((tick) => tick > 0)
                .map((tick) => (
                  <Line
                    key={tick}
                    x1={0}
                    x2={width}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={colors.chartGrid}
                    strokeWidth={chart.gridLineWidth}
                  />
                ))}
              {goal !== undefined && goal > 0 ? (
                <Line
                  testID="chart-goal-line"
                  x1={0}
                  x2={width}
                  y1={y(goal)}
                  y2={y(goal)}
                  stroke={colors.chartGoalLine}
                  strokeWidth={chart.goalLineWidth}
                  strokeDasharray={[...chart.goalDash]}
                />
              ) : null}
              {bars.map((bar, i) => {
                const slot = slots[i];
                const d = barPath(
                  slot.x,
                  height,
                  slot.width,
                  barHeight(bar.kcal, max, height),
                  chart.barRadiusTop,
                  chart.barRadiusBottom,
                );
                return d ? (
                  <Path
                    key={bar.key}
                    d={d}
                    fill={bar.isCurrent ? colors.chartBarActive : colors.chartBar}
                  />
                ) : null;
              })}
            </Svg>
          ) : null}

          {slots.map((slot, i) => (
            <Pressable
              key={bars[i].key}
              testID={`chart-bar-${bars[i].key}`}
              onPress={() => onSelect(bars[i].key)}
              accessibilityRole="button"
              accessibilityLabel={strings.progress.barLabel(bars[i].label, formatNumber(bars[i].kcal))}
              accessibilityState={{ selected: bars[i].key === selectedKey }}
              style={[styles.hit, { left: slot.hitX, width: slot.hitWidth }]}
            />
          ))}

          {selected && selectedSlot ? (
            <View
              testID="chart-tooltip"
              pointerEvents="none"
              onLayout={(e) => setTooltipWidth(e.nativeEvent.layout.width)}
              style={[
                styles.tooltip,
                {
                  left: clampedLeft(selectedSlot.center, tooltipWidth, width, chart.tooltipOverhang),
                  bottom: Math.min(
                    barHeight(selected.kcal, max, height) + chart.tooltipGap,
                    height - TOOLTIP_HEIGHT,
                  ),
                },
              ]}
            >
              <AppText variant="bodyStrong" tabular numberOfLines={1}>
                {strings.progress.kcal(formatNumber(selected.kcal))}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={styles.labels}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {bars.map((bar, i) => {
          const slot = slots[i];
          if (!slot) return null;
          if (isMonth && !showDayLabel(Number(bar.label), currentDay)) return null;
          const w = labelWidth(slot.width + GAP[period]);
          const current = bar.isCurrent;
          const variant = period === 'week' ? (current ? 'bodyStrong' : 'body') : current ? 'caption' : 'footnote';
          return (
            <AppText
              key={bar.key}
              variant={variant}
              color={current ? 'text' : 'textSecondary'}
              align="center"
              numberOfLines={1}
              style={[styles.label, { left: slot.center - w / 2, width: w }]}
            >
              {bar.label}
            </AppText>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.s },
  row: { flexDirection: 'row', gap: chart.axisGap },
  // Labels are 16 high; the column is 8 taller each side so each label centers on its grid line.
  axis: {
    width: chart.axisWidth,
    height: chart.height + type.footnote.lineHeight,
    marginTop: -type.footnote.lineHeight / 2,
    justifyContent: 'space-between',
  },
  plot: {
    flex: 1,
    height: chart.height,
    borderBottomWidth: chart.gridLineWidth,
    borderBottomColor: colors.hairline,
  },
  hit: { position: 'absolute', top: 0, bottom: 0 },
  tooltip: {
    position: 'absolute',
    paddingVertical: space.xs,
    paddingHorizontal: space.s,
    borderRadius: radius.s,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  labels: {
    marginLeft: chart.axisWidth + chart.axisGap,
    height: type.body.lineHeight,
  },
  label: { position: 'absolute', top: 0 },
});
