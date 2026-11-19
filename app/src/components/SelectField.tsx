import { ChevronDown } from 'lucide-react-native';
import { ActionSheetIOS, Alert, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';

import { strings } from '@/i18n';
import { borderWidth, colors, iconStroke, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import type { SegmentOption } from './SegmentedControl';

export interface SelectFieldProps<T extends string> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}

/** Label above a 56-high field that opens a native option sheet (looks like TextField). */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  testID,
}: SelectFieldProps<T>) {
  const current = options.find((o) => o.value === value);

  const open = () => {
    Keyboard.dismiss();
    const labels = options.map((o) => o.label);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: label, options: [...labels, strings.common.cancel], cancelButtonIndex: labels.length },
        (index) => {
          if (index < options.length) onChange(options[index].value);
        },
      );
    } else {
      Alert.alert(label, undefined, [
        ...options.map((o) => ({ text: o.label, onPress: () => onChange(o.value) })),
        { text: strings.common.cancel, style: 'cancel' as const },
      ]);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color="textTertiary">
        {label}
      </AppText>
      <Pressable
        testID={testID}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? ''}`}
        style={({ pressed }) => [styles.box, pressed && styles.pressed]}
      >
        <AppText variant="bodyL" numberOfLines={1} style={styles.value}>
          {current?.label}
        </AppText>
        <ChevronDown size={size.iconS} color={colors.chevron} strokeWidth={iconStroke.regular} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  box: {
    height: size.input,
    borderRadius: radius.m,
    borderWidth: borderWidth.strong,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: space.m,
    paddingRight: space.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  pressed: { backgroundColor: colors.neutralSoft },
  value: { flex: 1 },
});
