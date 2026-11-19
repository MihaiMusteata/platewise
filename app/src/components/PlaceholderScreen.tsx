import { router, type Href } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { strings } from '@/i18n';
import { space } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Screen } from './Screen';

export interface PlaceholderLink {
  label: string;
  href: Href;
  testID?: string;
}

export interface PlaceholderScreenProps {
  title: string;
  body?: string;
  /** close: X button (modal root) · back: chevron (pushed screen) · none: tab screen. */
  dismiss?: 'close' | 'back' | 'none';
  /** Temporary links to the next screens of a flow, until the real screen exists. */
  links?: PlaceholderLink[];
  /** Off for tab screens (the tab bar covers the bottom inset). */
  bottomInset?: boolean;
  /** Off for screens inside a page-sheet modal (see `Screen`). */
  topInset?: boolean;
  children?: React.ReactNode;
}

/** Temporary screen for routes whose real UI comes in a later task. */
export function PlaceholderScreen({
  title,
  body = strings.placeholder.body,
  dismiss = 'none',
  links = [],
  bottomInset = true,
  topInset = true,
  children,
}: PlaceholderScreenProps) {
  return (
    <Screen bottomInset={bottomInset} topInset={topInset}>
      {dismiss !== 'none' && (
        <IconButton
          testID="placeholder-dismiss"
          icon={dismiss === 'close' ? X : ChevronLeft}
          accessibilityLabel={dismiss === 'close' ? strings.common.close : strings.common.back}
          onPress={() => router.back()}
        />
      )}
      <View style={styles.text}>
        <AppText variant="h1" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="bodyL" color="textSecondary">
          {body}
        </AppText>
      </View>
      {links.map((link) => (
        <Button
          key={link.label}
          variant="link"
          label={link.label}
          testID={link.testID}
          onPress={() => router.push(link.href)}
          style={styles.link}
        />
      ))}
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { gap: space.xs },
  link: { alignSelf: 'flex-start' },
});
