import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, space, type } from '@/theme';

const styles = Object.keys(type) as (keyof typeof type)[];

/** Dev-only screen: renders every type style from the design tokens. */
export default function TypographyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top + layout.topExtra }]}
    >
      {styles.map((name) => (
        <Text key={name} style={[type[name], s.text]}>
          {name} {type[name].fontSize}/{type[name].lineHeight}
        </Text>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: layout.screenPaddingX, gap: space.m, paddingBottom: space.xxl },
  text: { color: colors.text },
});
