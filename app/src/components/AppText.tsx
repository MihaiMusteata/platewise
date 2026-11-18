import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, type } from '@/theme';

export type TextVariant = keyof typeof type;
export type TextColor = keyof typeof colors;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: TextColor;
  /** Use tabular figures (for numbers that change or align). */
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
}

/** Text with a type-scale variant and a color token. Screens never set fontFamily manually. */
export function AppText({
  variant = 'body',
  color = 'text',
  tabular = false,
  align,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        type[variant],
        { color: colors[color] },
        tabular && styles.tabular,
        align && { textAlign: align },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
});
