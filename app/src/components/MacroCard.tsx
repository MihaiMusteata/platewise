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
  /** Daily goal in grams. */
  goal: number;
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
  const ratio = goal > 0 ? value / goal : 0;
  const percent = `${formatNumber(ratio * 100)}%`;
  const label = ro.macros[macro];
  const unit = ro.common.grams;

  return (
    <View
      style={[styles.card, { backgroundColor: tone.tint }, style]}
      accessible
      accessibilityLabel={`${label}: ${formatNumber(value)} ${unit} / ${formatNumber(goal)} ${unit}, ${percent}`}
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
      <AppText variant="body" color="textSecondary" tabular>
        <AppText variant="numberS" tabular>
          {formatNumber(value)} {unit}
        </AppText>
        {` / ${formatNumber(goal)} ${unit}`}
      </AppText>
      <AppText variant="bodyStrong" tabular style={{ color: tone.text }}>
        {percent}
      </AppText>
      <ProgressBar
        value={ratio}
        color={tone.bar}
        trackColor={colors.macroTrack}
        style={styles.bar}
      />
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
