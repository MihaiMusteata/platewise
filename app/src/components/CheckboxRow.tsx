import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { borderWidth, colors, iconStroke, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';

export interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testID?: string;
}

/** White 56-high card with a 24 checkbox and a label; the whole row toggles. */
export function CheckboxRow({ label, checked, onChange, testID }: CheckboxRowProps) {
  return (
    <Pressable
      testID={testID}
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? (
          <Check size={size.checkMark} color={colors.onBrand} strokeWidth={iconStroke.bold} />
        ) : null}
      </View>
      <AppText variant="labelL">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: size.input,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    paddingHorizontal: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    ...shadow.card,
  },
  pressed: { backgroundColor: colors.neutralSoft },
  box: {
    width: size.iconM,
    height: size.iconM,
    borderRadius: radius.xs,
    borderWidth: borderWidth.strong,
    borderColor: colors.radioRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
});
