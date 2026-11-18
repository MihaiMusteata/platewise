import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, iconStroke, opacity, radius, shadow, size } from '@/theme';

export type IconButtonVariant =
  | 'surface'
  | 'outline'
  | 'soft'
  | 'mint'
  | 'dark'
  | 'darkSelected'
  | 'brand';

export interface IconButtonProps {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress?: () => void;
  /**
   * surface: white circle with card shadow (back buttons) ·
   * outline: white circle with hairline border · soft: neutral rounded square (stepper) ·
   * mint: mint circle (quick add) · dark: translucent on the scan screen ·
   * darkSelected: white circle on the scan screen (toggle that is on, e.g. the torch) ·
   * brand: brand-filled circle (scan button next to the search field).
   */
  variant?: IconButtonVariant;
  iconSize?: 'S' | 'M';
  /** 'm' = 48 (default), 'l' = 56 (matches the 56 search field / primary button height). */
  buttonSize?: 'm' | 'l';
  /** Icon stroke; defaults to `iconStroke.regular`. */
  strokeWidth?: number;
  disabled?: boolean;
  /** For toggles: exposes the on/off state to VoiceOver. */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const iconColor: Record<IconButtonVariant, string> = {
  surface: colors.text,
  outline: colors.text,
  soft: colors.text,
  mint: colors.brand,
  dark: colors.onBrand,
  darkSelected: colors.scanBackground,
  brand: colors.onBrand,
};

/** 48×48 (or 56×56) touch target with a 20 or 24 icon. */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'surface',
  iconSize = 'M',
  buttonSize = 'm',
  strokeWidth = iconStroke.regular,
  disabled = false,
  selected,
  style,
  testID,
}: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected == null ? { disabled } : { disabled, selected }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        buttonSize === 'l' && styles.large,
        pressed && (variant === 'brand' ? styles.brandPressed : styles.pressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon
        size={iconSize === 'M' ? size.iconM : size.iconS}
        color={iconColor[variant]}
        strokeWidth={strokeWidth}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: { backgroundColor: colors.surface, ...shadow.card },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.hairline,
    borderColor: colors.hairline,
  },
  soft: { backgroundColor: colors.neutralSoft, borderRadius: radius.m },
  mint: { backgroundColor: colors.mint },
  dark: { backgroundColor: colors.scanButton },
  darkSelected: { backgroundColor: colors.onBrand },
  brand: { backgroundColor: colors.brand },
  large: { width: size.button, height: size.button },
  brandPressed: { backgroundColor: colors.brandPressed },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
