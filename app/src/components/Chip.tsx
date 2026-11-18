import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radius, size, space } from '@/theme';

import { AppText } from './AppText';

export interface ChipProps {
  label: string;
  onPress?: () => void;
  /** Choice chips (e.g. meal picker): selected = brand fill, unselected = white with border. */
  selected?: boolean;
  /** 'choice' (default) toggles with `selected`; 'action' is the mint quick-action chip. */
  variant?: 'choice' | 'action';
  icon?: LucideIcon;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** 48-high pill chip. */
export function Chip({
  label,
  onPress,
  selected = false,
  variant = 'choice',
  icon: Icon,
  accessibilityLabel,
  style,
}: ChipProps) {
  const isAction = variant === 'action';
  const fg = isAction ? 'brand' : selected ? 'onBrand' : 'text';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={isAction ? undefined : { selected }}
      style={({ pressed }) => [
        styles.base,
        isAction ? styles.action : selected ? styles.selected : styles.unselected,
        pressed && (isAction || !selected) && styles.pressed,
        pressed && selected && !isAction && styles.selectedPressed,
        style,
      ]}
    >
      {Icon ? <Icon size={size.iconS} color={colors[fg]} /> : null}
      <AppText variant="bodyStrong" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: size.chip,
    borderRadius: radius.pill,
    paddingHorizontal: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
  },
  selected: {
    backgroundColor: colors.brand,
    borderWidth: borderWidth.strong,
    borderColor: colors.brand,
  },
  selectedPressed: { backgroundColor: colors.brandPressed, borderColor: colors.brandPressed },
  unselected: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.strong,
    borderColor: colors.border,
  },
  action: { backgroundColor: colors.mint },
  pressed: { backgroundColor: colors.neutralSoft },
});
