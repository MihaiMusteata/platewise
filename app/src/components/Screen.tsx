import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, space } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a vertical ScrollView. */
  scroll?: boolean;
  /** Vertical gap between direct children. Defaults to 16. */
  gap?: number;
  /** Apply the bottom safe-area inset (off when a tab bar sits below). */
  bottomInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Screen container: background, top safe area + 8, side padding 24, optional scroll. */
export function Screen({
  children,
  scroll = false,
  gap = space.m,
  bottomInset = true,
  contentStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + layout.topExtra,
    paddingBottom: (bottomInset ? insets.bottom : 0) + space.xl,
    gap,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.screen, styles.content, padding, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: layout.screenPaddingX },
});
