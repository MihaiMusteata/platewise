import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, iconStroke, opacity, radius, shadow, size } from '@/theme';

export type IconButtonVariant = 'surface' | 'outline' | 'soft' | 'mint' | 'dark';

export interface IconButtonProps {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress?: () => void;
  /**
   * surface: white circle with card shadow (back buttons) ·
   * outline: white circle with hairline border · soft: neutral rounded square (stepper) ·
   * mint: mint circle (quick add) · dark: translucent on the scan screen.
   */
  variant?: IconButtonVariant;
  iconSize?: 'S' | 'M';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const iconColor: Record<IconButtonVariant, string> = {
  surface: colors.text,
  outline: colors.text,
  soft: colors.text,
  mint: colors.brand,
  dark: colors.onBrand,
};

/** 48×48 touch target with a 20 or 24 icon. */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'surface',
  iconSize = 'M',
  disabled = false,
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
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon
        size={iconSize === 'M' ? size.iconM : size.iconS}
        color={iconColor[variant]}
        strokeWidth={iconStroke.regular}
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
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
});
