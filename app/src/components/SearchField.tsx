import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { borderWidth, colors, iconStroke, radius, size, space, type } from '@/theme';

export interface SearchFieldProps
  extends Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'accessibilityLabel'> {
  /** Accessible name (the design has no visible label); also used as the placeholder. */
  label: string;
}

/** 56-high pill search input with a leading search icon (AddFood.html). */
export function SearchField({ label, onFocus, onBlur, placeholder, ...input }: SearchFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.box, focused && styles.focused]}>
      <Search size={size.iconS} color={colors.textSecondary} strokeWidth={iconStroke.regular} />
      <TextInput
        {...input}
        accessibilityLabel={label}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.brand}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
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
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    height: size.input,
    borderRadius: radius.pill,
    borderWidth: borderWidth.strong,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  focused: { borderColor: colors.brand },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: type.bodyL.fontFamily,
    fontSize: type.bodyL.fontSize,
    color: colors.text,
  },
});
