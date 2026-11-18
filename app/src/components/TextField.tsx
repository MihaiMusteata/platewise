import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { borderWidth, colors, radius, size, space, type } from '@/theme';

import { AppText } from './AppText';

export interface TextFieldProps
  extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  /** Unit shown inside the field on the right, e.g. "kg" or "cm". */
  suffix?: string;
  /** Validation hint shown under the field (calm amber, never red). */
  error?: string;
}

/** Label above a 56-high input (radius 16, 1.5 border). */
export function TextField({ label, suffix, error, onFocus, onBlur, ...input }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <AppText variant="label" color="textTertiary">
        {label}
      </AppText>
      <View style={[styles.box, focused && styles.focused, error != null && styles.invalid]}>
        <TextInput
          {...input}
          accessibilityLabel={input.accessibilityLabel ?? label}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.brand}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {suffix ? (
          <AppText variant="labelL" color="textSecondary">
            {suffix}
          </AppText>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="attention" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
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
    paddingHorizontal: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  focused: { borderColor: colors.brand },
  invalid: { borderColor: colors.attention },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: type.bodyL.fontFamily,
    fontSize: type.bodyL.fontSize,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
