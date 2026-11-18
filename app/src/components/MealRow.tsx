import { ChevronRight, Plus, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import ro from '@/i18n/ro';
import { formatNumber } from '@/lib/format';
import { colors, iconStroke, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';
import { FoodThumb, type ThumbTint } from './FoodThumb';

export interface MealRowProps {
  title: string;
  subtitle?: string;
  kcal: number;
  tint?: ThumbTint;
  icon?: LucideIcon;
  onPress?: () => void;
  /** Hide the chevron (e.g. rows that are not navigable). Defaults to shown when onPress is set. */
  showChevron?: boolean;
  testID?: string;
}

export interface MealRowAction {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export interface EmptyMealRowProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  action: MealRowAction;
}

/** White row card: thumb, title + one-line subtitle, kcal on the right, chevron. */
export function MealRow({
  title,
  subtitle,
  kcal,
  tint,
  icon,
  onPress,
  showChevron = onPress != null,
  testID,
}: MealRowProps) {
  const kcalText = `${formatNumber(kcal)} ${ro.common.kcal}`;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, subtitle, kcalText].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <FoodThumb tint={tint} icon={icon} name={title} />
      <View style={styles.text}>
        <AppText variant="bodyLStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <AppText variant="bodyLStrong" tabular>
        {kcalText}
      </AppText>
      {showChevron ? <ChevronRight size={size.iconS} color={colors.chevron} strokeWidth={iconStroke.regular} /> : null}
    </Pressable>
  );
}

/** Empty-day meal row (TodayEmpty.html): 48 neutral thumb, title + hint, mint "Adaugă" pill. */
export function EmptyMealRow({ title, subtitle, icon, action }: EmptyMealRowProps) {
  return (
    <View style={styles.emptyRow}>
      <FoodThumb tint="neutral" icon={icon} name={title} size="s" />
      <View style={styles.text}>
        <AppText variant="bodyLStrong" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="body" color="textSecondary" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Pressable
        testID={action.testID}
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.accessibilityLabel ?? action.label}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Plus size={size.iconXS} color={colors.brand} strokeWidth={iconStroke.bold} />
        <AppText variant="bodyStrong" color="brand">
          {action.label}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    paddingVertical: space.xs,
    paddingHorizontal: space.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    ...shadow.card,
  },
  pressed: { backgroundColor: colors.neutralSoft },
  text: { flex: 1, minWidth: 0, gap: space.xxs },
  emptyRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    paddingVertical: space.s,
    paddingLeft: space.s,
    paddingRight: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    ...shadow.card,
  },
  action: {
    height: size.minTouch,
    paddingHorizontal: space.s,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
  },
  actionPressed: { backgroundColor: colors.neutralSoft },
});
