import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, iconStroke, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';

export interface FabProps {
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
  /** Position it (e.g. absolute right/bottom) from the screen. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Floating extended action button: 56 high brand pill with icon + label (Main.html). */
export function Fab({ label, icon: Icon, onPress, style, testID }: FabProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed, style]}
    >
      <Icon size={size.iconM} color={colors.onBrand} strokeWidth={iconStroke.bold} />
      <AppText variant="button" color="onBrand">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    height: size.fab,
    borderRadius: radius.pill,
    paddingLeft: space.m,
    paddingRight: space.l,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.brand,
    ...shadow.fab,
  },
  pressed: { backgroundColor: colors.brandPressed },
});
