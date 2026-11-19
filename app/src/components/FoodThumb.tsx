import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { iconStroke, radius, size, thumbs } from '@/theme';

import { AppText } from './AppText';

export type ThumbTint = keyof typeof thumbs;

export interface FoodThumbProps {
  tint?: ThumbTint;
  /** Icon to draw; falls back to the first letter of `name`. */
  icon?: LucideIcon;
  name?: string;
  /** 'xl' = 72 rounded tile (Product found), 'l' = 64 (Log food header), 'm' = 56 (default), 's' = 48. */
  size?: 'xl' | 'l' | 'm' | 's';
}

/** Round tinted tile used as a food / meal thumbnail. */
export function FoodThumb({ tint = 'green', icon: Icon, name, size: variant = 'm' }: FoodThumbProps) {
  const tone = thumbs[tint];
  const dim = { xl: size.thumbProduct, l: size.thumbLarge, m: size.thumb, s: size.thumbSmall }[variant];
  const initial = name?.trim().charAt(0).toLocaleUpperCase('ro-RO') ?? '';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.thumb,
        variant === 'xl' && styles.tile,
        { width: dim, height: dim, backgroundColor: tone.bg },
      ]}
    >
      {Icon ? (
        <Icon
          size={variant === 'l' || variant === 'xl' ? size.iconL : size.iconM}
          color={tone.fg}
          strokeWidth={iconStroke.thin}
        />
      ) : (
        <AppText
          variant={{ xl: 'h2' as const, l: 'h2' as const, m: 'h3' as const, s: 'bodyLStrong' as const }[variant]}
          style={{ color: tone.fg }}
        >
          {initial}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    flexShrink: 0,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: { borderRadius: radius.m },
});
