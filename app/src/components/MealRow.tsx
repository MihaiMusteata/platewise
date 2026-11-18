import { ChevronRight, type LucideIcon } from 'lucide-react-native';
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
}: MealRowProps) {
  const kcalText = `${formatNumber(kcal)} ${ro.common.kcal}`;
  return (
    <Pressable
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
});
