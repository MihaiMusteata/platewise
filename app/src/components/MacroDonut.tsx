import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import ro from '@/i18n/ro';
import { donutArcs } from '@/lib/chartGeometry';
import { formatNumber } from '@/lib/format';
import type { MacroShare } from '@/lib/progress';
import { chart, colors, macros, radius, size, space } from '@/theme';

import { AppText } from './AppText';

export interface MacroDonutProps {
  share: MacroShare;
  /** Average kcal per logged day, shown in the center. */
  averageKcal: number;
}

const KEYS = ['protein', 'carbs', 'fat'] as const;
const C = chart.donutViewBox / 2;

/**
 * Macro distribution (Progress.html): donut of energy share per macro with the average kcal per
 * day in the center and a legend. With nothing logged: a grey ring and a calm note.
 */
export function MacroDonut({ share, averageKcal }: MacroDonutProps) {
  const empty = share.protein + share.carbs + share.fat === 0;
  const arcs = donutArcs(
    KEYS.map((key) => ({ key, percent: share[key] })),
    chart.donutRadius,
    chart.donutGap,
  );
  const pct = (n: number) => `${n}%`;

  return (
    <View style={styles.row}>
      <View
        style={styles.donut}
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          empty
            ? ro.progress.macrosEmpty
            : ro.progress.donutLabel(pct(share.protein), pct(share.carbs), pct(share.fat))
        }
      >
        <Svg
          width={chart.donutSize}
          height={chart.donutSize}
          viewBox={`0 0 ${chart.donutViewBox} ${chart.donutViewBox}`}
        >
          {empty ? (
            <Circle
              testID="donut-empty-ring"
              cx={C}
              cy={C}
              r={chart.donutRadius}
              fill="none"
              stroke={colors.segmentTrack}
              strokeWidth={chart.donutStroke}
            />
          ) : (
            arcs.map((arc) => (
              <Circle
                key={arc.key}
                cx={C}
                cy={C}
                r={chart.donutRadius}
                fill="none"
                stroke={macros[arc.key as (typeof KEYS)[number]].bar}
                strokeWidth={chart.donutStroke}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset}
                transform={`rotate(-90 ${C} ${C})`}
              />
            ))
          )}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <AppText variant="sectionTitle" tabular testID="donut-average">
            {formatNumber(averageKcal)}
          </AppText>
          <AppText variant="footnote" color="textSecondary">
            {ro.progress.perDay}
          </AppText>
        </View>
      </View>

      {empty ? (
        <AppText variant="body" color="textSecondary" style={styles.legend} testID="macros-empty">
          {ro.progress.macrosEmpty}
        </AppText>
      ) : (
        <View style={styles.legend}>
          {KEYS.map((key) => (
            <View key={key} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: macros[key].bar }]} />
              <AppText variant="bodyL" color="textTertiary" style={styles.legendLabel}>
                {ro.macros[key]}
              </AppText>
              <AppText variant="numberS" tabular testID={`legend-${key}`}>
                {pct(share[key])}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.l },
  donut: { width: chart.donutSize, height: chart.donutSize },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flex: 1, gap: space.s },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  dot: { width: size.legendDot, height: size.legendDot, borderRadius: radius.pill },
  legendLabel: { flex: 1 },
});
