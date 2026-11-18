import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import ro from '@/i18n/ro';
import { colors, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';

export interface SnackbarProps {
  message: string;
  /** Action label; defaults to "Anulează". */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Dark 56-high status bar with a lime text action. Positioning and timing are up to the screen. */
export function Snackbar({ message, actionLabel = ro.common.undo, onAction, style }: SnackbarProps) {
  return (
    <View style={[styles.bar, style]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <AppText variant="bodyL" color="onBrand" numberOfLines={1} style={styles.message}>
        {message}
      </AppText>
      {onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <AppText variant="bodyLStrong" color="lime">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: size.snackbar,
    borderRadius: radius.m,
    backgroundColor: colors.snackbar,
    paddingLeft: space.m,
    paddingRight: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xs,
    ...shadow.snackbar,
  },
  message: { flex: 1 },
  action: {
    height: size.minTouch,
    paddingHorizontal: space.m,
    borderRadius: radius.s,
    justifyContent: 'center',
  },
  actionPressed: { backgroundColor: colors.scanButton },
});
