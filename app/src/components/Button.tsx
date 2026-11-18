import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, opacity, radius, shadow, size, space } from '@/theme';

import { AppText, type TextColor } from './AppText';

export type ButtonVariant = 'primary' | 'outline' | 'text' | 'link';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: LucideIcon;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const labelColor: Record<ButtonVariant, TextColor> = {
  primary: 'onBrand',
  outline: 'brand',
  text: 'textSecondary',
  link: 'brand',
};

/**
 * Pill button. Primary 56 high with brand background and shadow; outline 1.5 brand border;
 * text 48 high in secondary text color; link 48 high in brand color.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon: Icon,
  accessibilityLabel,
  style,
  testID,
}: ButtonProps) {
  const color = labelColor[variant];
  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && pressedStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {Icon ? <Icon size={size.iconM} color={colors[color]} /> : null}
        <AppText variant={variant === 'text' || variant === 'link' ? 'labelL' : 'button'} color={color}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: size.button,
    borderRadius: radius.pill,
    paddingHorizontal: space.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  primary: { backgroundColor: colors.brand, ...shadow.primaryButton },
  outline: { borderWidth: borderWidth.strong, borderColor: colors.brand },
  text: { height: size.minTouch },
  link: { height: size.minTouch },
  disabled: { opacity: opacity.disabled, shadowOpacity: 0, elevation: 0 },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brandPressed },
  outline: { backgroundColor: colors.mint },
  text: { backgroundColor: colors.neutralSoft },
  link: { backgroundColor: colors.mint },
});
