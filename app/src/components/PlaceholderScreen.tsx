import { router, type Href } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import ro from '@/i18n/ro';
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
  children?: React.ReactNode;
}

/** Temporary screen for routes whose real UI comes in a later task. */
export function PlaceholderScreen({
  title,
  body = ro.placeholder.body,
  dismiss = 'none',
  links = [],
  bottomInset = true,
  children,
}: PlaceholderScreenProps) {
  return (
    <Screen bottomInset={bottomInset}>
      {dismiss !== 'none' && (
        <IconButton
          testID="placeholder-dismiss"
          icon={dismiss === 'close' ? X : ChevronLeft}
          accessibilityLabel={dismiss === 'close' ? ro.common.close : ro.common.back}
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
