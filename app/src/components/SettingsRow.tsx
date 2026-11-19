import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { borderWidth, colors, iconStroke, layout, opacity, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import { Card } from './Card';

export interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

/** Overline title above a white card of rows (Settings.html). */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" color="textSecondary" accessibilityRole="header">
        {title}
      </AppText>
      <Card padded={false}>{children}</Card>
    </View>
  );
}

export interface SettingsRowProps {
  title: string;
  /** Smaller grey line under the title. */
  subtitle?: string;
  /** Grey value on the right ("2.000 kcal", "Menținere"). */
  value?: string;
  /** Small mint pill on the right ("În curând"). */
  badge?: string;
  /** Switch on the right instead of a chevron. */
  toggle?: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean };
  /** Makes the row pressable and shows a chevron. */
  onPress?: () => void;
  /** Title in the danger color (destructive actions only). */
  destructive?: boolean;
  /** Unavailable for now: muted title, not pressable. */
  muted?: boolean;
  /** Draws the hairline above the row (every row except the first in a card). */
  divider?: boolean;
  testID?: string;
}

/** One row of a Settings card: title (+ subtitle), optional value, badge, switch or chevron. */
export function SettingsRow({
  title,
  subtitle,
  value,
  badge,
  toggle,
  onPress,
  destructive = false,
  muted = false,
  divider = true,
  testID,
}: SettingsRowProps) {
  const titleColor = destructive ? 'danger' : muted ? 'textSecondary' : 'text';
  const content = (
    <>
      <View style={styles.text}>
        <AppText variant="labelL" color={titleColor}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="bodyL" color="textSecondary" tabular>
          {value}
        </AppText>
      ) : null}
      {badge ? (
        <View style={styles.badge}>
          <AppText variant="badge" color="brand">
            {badge}
          </AppText>
        </View>
      ) : null}
      {toggle ? (
        <Switch
          testID={testID ? `${testID}-switch` : undefined}
          value={toggle.value}
          onValueChange={toggle.onChange}
          disabled={toggle.disabled}
          accessibilityLabel={title}
          trackColor={{ false: colors.switchTrackOff, true: colors.brand }}
          ios_backgroundColor={colors.switchTrackOff}
          thumbColor={colors.onBrand}
        />
      ) : null}
      {onPress ? (
        <ChevronRight size={size.iconS} color={colors.chevron} strokeWidth={iconStroke.regular} />
      ) : null}
    </>
  );

  const rowStyle = [styles.row, divider && styles.divider];
  if (onPress && !muted) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={[title, value].filter(Boolean).join(', ')}
        style={({ pressed }) => [...rowStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View
      testID={testID}
      style={rowStyle}
      accessible={!toggle}
      accessibilityState={muted ? { disabled: true } : undefined}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.xs },
  row: {
    minHeight: size.listRow,
    paddingVertical: space.s,
    paddingHorizontal: layout.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  divider: { borderTopWidth: borderWidth.hairline, borderTopColor: colors.divider },
  pressed: { opacity: opacity.pressed },
  text: { flex: 1, gap: space.xxs },
  badge: {
    height: size.badge,
    paddingHorizontal: space.s,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
    justifyContent: 'center',
  },
});
