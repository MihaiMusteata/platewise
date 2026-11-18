import { Trash2, type LucideIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import ro from '@/i18n/ro';
import { formatNumber } from '@/lib/format';
import { colors, iconStroke, opacity, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';
import { FoodThumb, type ThumbTint } from './FoodThumb';

export interface SwipeableEntryRowProps {
  title: string;
  subtitle?: string;
  kcal: number;
  tint?: ThumbTint;
  icon?: LucideIcon;
  /** Called from the revealed "Șterge" action or the VoiceOver "Șterge" action. */
  onDelete: () => void;
  testID?: string;
}

/**
 * Log entry card (TodayDelete.html): swipe left to reveal a 96-wide red "Șterge" action.
 * Swipe is not discoverable for VoiceOver, so the row also exposes a "delete" accessibility action.
 */
export function SwipeableEntryRow({
  title,
  subtitle,
  kcal,
  tint,
  icon,
  onDelete,
  testID,
}: SwipeableEntryRowProps) {
  const swipeable = useRef<SwipeableMethods>(null);
  const kcalText = `${formatNumber(kcal)} ${ro.common.kcal}`;

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'delete') onDelete();
  };

  const renderRightActions = () => (
    <Pressable
      testID={testID ? `${testID}-delete` : undefined}
      onPress={() => {
        swipeable.current?.close();
        onDelete();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${ro.home.delete} ${title}`}
      style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
    >
      <Trash2 size={size.iconS} color={colors.onBrand} strokeWidth={iconStroke.regular} />
      <AppText variant="bodyLStrong" color="onBrand">
        {ro.home.delete}
      </AppText>
    </Pressable>
  );

  return (
    <View style={styles.shadow}>
      <ReanimatedSwipeable
        ref={swipeable}
        testID={testID ? `${testID}-swipeable` : undefined}
        friction={1}
        rightThreshold={size.swipeAction / 2}
        overshootRight={false}
        renderRightActions={renderRightActions}
        containerStyle={styles.container}
      >
        <View
          testID={testID}
          accessible
          accessibilityLabel={[title, subtitle, kcalText].filter(Boolean).join(', ')}
          accessibilityActions={[{ name: 'delete', label: ro.home.delete }]}
          onAccessibilityAction={onAccessibilityAction}
          style={styles.row}
        >
          <FoodThumb tint={tint} icon={icon} name={title} />
          <View style={styles.text}>
            <AppText variant="bodyLStrong" numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="body" color="textSecondary" numberOfLines={1} tabular>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          <AppText variant="bodyLStrong" tabular>
            {kcalText}
          </AppText>
        </View>
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.m, backgroundColor: colors.surface, ...shadow.card },
  container: { borderRadius: radius.m, overflow: 'hidden' },
  row: {
    backgroundColor: colors.surface,
    padding: space.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  text: { flex: 1, minWidth: 0, gap: space.xxs },
  delete: {
    width: size.swipeAction,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
  },
  deletePressed: { opacity: opacity.pressed },
});
