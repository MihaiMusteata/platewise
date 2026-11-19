import { ChevronLeft, X, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { strings } from '@/i18n';
import { colors, iconStroke, layout, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { Screen } from './Screen';

export interface StateViewProps {
  /** Small centered header title ("Rezultatul scanării"). */
  headerTitle: string;
  /** close: X (modal root) · back: chevron (pushed screen). */
  dismiss: 'close' | 'back';
  onDismiss: () => void;
  icon: LucideIcon;
  /** Badge colors: neutral grey (camera off, offline) or mint with brand icon (not found). */
  tone?: 'neutral' | 'mint';
  title: string;
  body: string;
  /** Content under the message (code pill, recent foods…). */
  children?: ReactNode;
  /** Buttons pinned to the bottom. */
  actions: ReactNode;
  /** Space between header and badge (on top of the 16 gap). */
  topSpace?: number;
  testID?: string;
}

/**
 * Full-screen state with a round icon badge, H2 title, centered message and bottom actions
 * (CameraOff.html, ScanNotFound.html, Offline.html, scan limit).
 */
export function StateView({
  headerTitle,
  dismiss,
  onDismiss,
  icon: Icon,
  tone = 'neutral',
  title,
  body,
  children,
  actions,
  topSpace = space.l,
  testID,
}: StateViewProps) {
  const mint = tone === 'mint';
  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header} testID={testID}>
        <IconButton
          testID={dismiss === 'close' ? 'scan-close' : 'state-back'}
          icon={dismiss === 'close' ? X : ChevronLeft}
          iconSize="S"
          accessibilityLabel={dismiss === 'close' ? strings.common.close : strings.common.back}
          onPress={onDismiss}
        />
        <AppText variant="bodyLStrong">{headerTitle}</AppText>
        <View style={styles.headerSpacer} />
      </View>
      <View style={{ height: topSpace }} />
      <View style={styles.body}>
        <View
          style={[styles.badge, mint && styles.badgeMint]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Icon
            size={size.stateIcon}
            color={mint ? colors.brand : colors.text}
            strokeWidth={iconStroke.thin}
          />
        </View>
        <AppText variant="h2" align="center" accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="bodyL" color="textSecondary" align="center" style={styles.text}>
          {body}
        </AppText>
      </View>
      {children}
      <View style={styles.flex} />
      {actions}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  header: {
    height: size.iconButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: { width: size.iconButton },
  body: { alignItems: 'center', gap: space.s },
  badge: {
    width: size.stateBadge,
    height: size.stateBadge,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMint: { backgroundColor: colors.mint },
  title: { marginTop: space.xs },
  text: { maxWidth: layout.textMaxWidth },
  flex: { flex: 1 },
});
