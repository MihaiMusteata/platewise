import { Droplet, Dumbbell, Wheat, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import ro from '@/i18n/ro';
import { formatNumber } from '@/lib/format';
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
  style?: StyleProp<ViewStyle>;
}

const icons: Record<MacroKey, LucideIcon> = {
  protein: Dumbbell,
  carbs: Wheat,
  fat: Droplet,
};

/** Tinted macro tile: icon, label, "x g / y g", percent and progress bar in the macro color. */
export function MacroCard({ macro, value, goal, style }: MacroCardProps) {
  const tone = macros[macro];
  const Icon = icons[macro];
  const hasGoal = goal != null;
  const ratio = goal != null && goal > 0 ? value / goal : 0;
  const percent = `${formatNumber(ratio * 100)}%`;
  const label = ro.macros[macro];
  const unit = ro.common.grams;
  const amount = `${formatNumber(value)} ${unit}`;

  return (
    <View
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
  label: { marginTop: space.xxs },
  bar: { marginTop: space.xxs },
});
