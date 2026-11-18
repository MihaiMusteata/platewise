import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, size } from '@/theme';

export interface ProgressBarProps {
  /** Progress 0..1; values outside are clamped. */
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Rounded track with a fill. Pass colors from tokens (e.g. macros.protein.bar). */
export function ProgressBar({
  value,
  color = colors.brand,
  trackColor = colors.neutralSoft,
  height = size.progressBar,
  accessibilityLabel,
  style,
}: ProgressBarProps) {
  const progress = clampProgress(value);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={[styles.track, { height, backgroundColor: trackColor }, style]}
    >
      <View
        testID="progress-fill"
        style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.xs, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.xs },
});
