import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radius, shadow } from '@/theme';

export interface CardProps {
  children: ReactNode;
  /** Corner radius: 'l' (24, default cards) or 'm' (16, list rows and inputs). */
  rounded?: 'm' | 'l';
  /** Inner padding 16 (default) or none. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** White surface with card shadow. */
export function Card({ children, rounded = 'l', padded = true, style }: CardProps) {
  return (
    <View
      style={[styles.card, { borderRadius: radius[rounded] }, padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, ...shadow.card },
  padded: { padding: layout.cardPadding },
});
