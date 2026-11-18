import type { LucideIcon } from 'lucide-react-native';
import { Keyboard, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, iconStroke, radius, size, space } from '@/theme';

import { AppText } from './AppText';

export interface ChoiceCardProps {
  title: string;
  /** Second line; when set the card is the tall (72) option with a trailing radio. */
  subtitle?: string;
  icon?: LucideIcon;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

function Radio({ selected, dim }: { selected: boolean; dim: number }) {
  return (
    <View
      style={[
        styles.radio,
        { width: dim, height: dim, borderColor: selected ? colors.brand : colors.radioRing },
      ]}
    >
      {selected ? <View style={styles.dot} /> : null}
    </View>
  );
}

/**
 * Single-choice card (radio). Compact: 56 high, leading 20 radio, label (onboarding sex).
 * Tall: 72 high, 48 icon circle, title + subtitle, trailing 24 radio (onboarding goal).
 */
export function ChoiceCard({ title, subtitle, icon: Icon, selected, onPress, testID, style }: ChoiceCardProps) {
  const tall = subtitle != null;
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => [
        styles.card,
        tall ? styles.tall : styles.compact,
        selected ? styles.selected : pressed && styles.pressed,
        style,
      ]}
    >
      {!tall ? <Radio selected={selected} dim={size.iconS} /> : null}
      {Icon ? (
        <View style={[styles.iconCircle, { backgroundColor: selected ? colors.surface : colors.neutralSoft }]}>
          <Icon size={size.iconM} color={colors.brand} strokeWidth={iconStroke.regular} />
        </View>
      ) : null}
      {tall ? (
        <View style={styles.text}>
          <AppText variant="bodyLStrong">{title}</AppText>
          <AppText variant="body" color="textSecondary">
            {subtitle}
          </AppText>
        </View>
      ) : (
        <AppText variant="labelL">{title}</AppText>
      )}
      {tall ? <Radio selected={selected} dim={size.iconM} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.m,
    borderWidth: borderWidth.strong,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compact: { height: size.input, gap: space.s },
  tall: { height: size.choiceCard, gap: space.m },
  selected: { borderColor: colors.brand, backgroundColor: colors.mint },
  pressed: { backgroundColor: colors.neutralSoft },
  iconCircle: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: space.xxs },
  radio: {
    borderRadius: radius.pill,
    borderWidth: borderWidth.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: size.radioDot,
    height: size.radioDot,
    borderRadius: radius.xs,
    backgroundColor: colors.brand,
  },
});
