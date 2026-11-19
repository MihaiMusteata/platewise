import { Droplet, Dumbbell, Wheat, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { strings } from '@/i18n';
import { formatDecimal, formatNumber } from '@/lib/format';
import { colors, iconStroke, macros, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import { ProgressBar } from './ProgressBar';

export type MacroKey = keyof typeof macros;

export interface MacroCardProps {
  macro: MacroKey;
  /** Grams eaten so far. */
  value: number;
  /** Daily goal in grams. Omit to show only the grams eaten (tracking paused). */
  goal?: number;
  /**
   * default: Home tile with icon, "x g / y g", percent and bar ·
   * compact: Log food tile with label, "x,y g" and a thin bar toward the goal (no goal text).
   */
  variant?: 'default' | 'compact';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const icons: Record<MacroKey, LucideIcon> = {
  protein: Dumbbell,
  carbs: Wheat,
  fat: Droplet,
};

/** Tinted macro tile: icon, label, "x g / y g", percent and progress bar in the macro color. */
export function MacroCard({
  macro,
  value,
  goal,
  variant = 'default',
  style,
  testID,
}: MacroCardProps) {
  const tone = macros[macro];
  const Icon = icons[macro];
  const hasGoal = goal != null;
  const ratio = goal != null && goal > 0 ? value / goal : 0;
  const percent = `${formatNumber(ratio * 100)}%`;
  const label = strings.macros[macro];
  const unit = strings.common.grams;
  const amount = `${formatNumber(value)} ${unit}`;

  if (variant === 'compact') {
    const compactAmount = `${formatDecimal(value)} ${unit}`;
    return (
      <View
        testID={testID}
        style={[styles.compact, { backgroundColor: tone.tint }, style]}
        accessible
        accessibilityLabel={`${label}: ${compactAmount}`}
      >
        <AppText variant="caption" style={{ color: tone.text }} numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="numberS" tabular numberOfLines={1} adjustsFontSizeToFit>
          {compactAmount}
        </AppText>
        {hasGoal ? (
          <ProgressBar
            value={ratio}
            color={tone.bar}
            trackColor={colors.macroTrack}
            height={size.progressBarSmall}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: tone.tint }, style]}
      accessible
      accessibilityLabel={
        hasGoal ? `${label}: ${amount} / ${formatNumber(goal)} ${unit}, ${percent}` : `${label}: ${amount}`
      }
    >
      <Icon
        size={size.iconM}
        color={tone.bar}
        fill={macro === 'fat' ? tone.bar : 'none'}
        strokeWidth={macro === 'fat' ? 0 : iconStroke.regular}
      />
      <AppText variant="body" color="textTertiary" style={styles.label}>
        {label}
      </AppText>
      <AppText variant="body" color="textSecondary" tabular numberOfLines={1} adjustsFontSizeToFit>
        <AppText variant="numberS" tabular>
          {amount}
        </AppText>
        {hasGoal ? ` / ${formatNumber(goal)} ${unit}` : null}
      </AppText>
      {hasGoal ? (
        <>
          <AppText variant="bodyStrong" tabular style={{ color: tone.text }}>
            {percent}
          </AppText>
          <ProgressBar
            value={ratio}
            color={tone.bar}
            trackColor={colors.macroTrack}
            style={styles.bar}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.m,
    paddingTop: space.m,
    paddingHorizontal: space.s,
    paddingBottom: space.s,
    gap: space.xxs,
  },
  compact: {
    flex: 1,
    borderRadius: radius.m,
    padding: space.s,
    gap: space.xxs,
  },
  label: { marginTop: space.xxs },
  bar: { marginTop: space.xxs },
});
