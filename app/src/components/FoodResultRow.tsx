import { Check, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, iconStroke, opacity, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import { FoodThumb, type ThumbTint } from './FoodThumb';

export interface FoodResultRowProps {
  name: string;
  subtitle: string;
  tint?: ThumbTint;
  onPress: () => void;
  onQuickAdd: () => void;
  quickAddLabel: string;
  /** Shows a check instead of the plus after a quick add. */
  added?: boolean;
  addedLabel?: string;
  /** Hairline above the row (every row but the first in a card). */
  divider?: boolean;
  testID?: string;
}

/** Search result inside a card: 48 thumb, name + serving line, mint quick-add button (AddFood.html). */
export function FoodResultRow({
  name,
  subtitle,
  tint,
  onPress,
  onQuickAdd,
  quickAddLabel,
  added = false,
  addedLabel,
  divider = false,
  testID,
}: FoodResultRowProps) {
  const Icon = added ? Check : Plus;
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${subtitle}`}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <FoodThumb tint={tint} name={name} size="s" />
        <View style={styles.text}>
          <AppText variant="bodyLStrong" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="body" color="textSecondary" numberOfLines={1} tabular>
            {subtitle}
          </AppText>
        </View>
      </Pressable>
      <Pressable
        testID={testID ? `${testID}-add` : undefined}
        onPress={onQuickAdd}
        accessibilityRole="button"
        accessibilityLabel={added && addedLabel ? addedLabel : quickAddLabel}
        style={({ pressed }) => [
          styles.add,
          added && styles.added,
          pressed && (added ? styles.addedPressed : styles.addPressed),
        ]}
      >
        <Icon
          size={size.iconS}
          color={added ? colors.onBrand : colors.brand}
          strokeWidth={iconStroke.bold}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.s,
    paddingLeft: space.m,
    paddingRight: space.s,
    gap: space.s,
  },
  divider: { borderTopWidth: borderWidth.hairline, borderTopColor: colors.divider },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: space.s },
  pressed: { opacity: opacity.pressed },
  text: { flex: 1, minWidth: 0, gap: space.xxs },
  add: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: { backgroundColor: colors.neutralSoft },
  added: { backgroundColor: colors.brand },
  addedPressed: { backgroundColor: colors.brandPressed },
});
