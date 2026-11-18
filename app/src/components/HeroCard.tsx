import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow } from '@/theme';

export interface HeroCardProps {
  children: ReactNode;
  /** Padding, gap etc. of the inner gradient surface. */
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Green 135° gradient card (radius 24, hero shadow) for the daily target. */
export function HeroCard({ children, contentStyle, style, accessibilityLabel }: HeroCardProps) {
  return (
    <View style={[styles.shadow, style]} accessibilityLabel={accessibilityLabel}>
      <LinearGradient
        colors={[colors.heroFrom, colors.heroTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, contentStyle]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.l, backgroundColor: colors.heroFrom, ...shadow.hero },
  gradient: { borderRadius: radius.l, overflow: 'hidden' },
});
