import { CameraOff, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import ro from '@/i18n/ro';
import { colors, iconStroke, layout, radius, size, space } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Screen } from './Screen';

export interface CameraOffStateProps {
  onClose: () => void;
  onOpenSettings: () => void;
  onManualEntry: () => void;
}

/** Scan screen when camera access is denied (CameraOff.html). */
export function CameraOffState({ onClose, onOpenSettings, onManualEntry }: CameraOffStateProps) {
  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          testID="scan-close"
          icon={X}
          iconSize="S"
          accessibilityLabel={ro.common.close}
          onPress={onClose}
        />
        <AppText variant="bodyLStrong">{ro.scan.title}</AppText>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.top} />
      <View style={styles.body}>
        <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no">
          <CameraOff size={size.stateIcon} color={colors.text} strokeWidth={iconStroke.thin} />
        </View>
        <AppText variant="h2" align="center" accessibilityRole="header" style={styles.title}>
          {ro.scan.cameraOff.title}
        </AppText>
        <AppText variant="bodyL" color="textSecondary" align="center" style={styles.text}>
          {ro.scan.cameraOff.body}
        </AppText>
      </View>
      <View style={styles.flex} />
      <Button
        testID="camera-settings"
        label={ro.scan.cameraOff.openSettings}
        onPress={onOpenSettings}
      />
      <Button
        testID="scan-manual"
        variant="outline"
        label={ro.scan.manualEntry}
        onPress={onManualEntry}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: size.iconButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: { width: size.iconButton },
  top: { height: space.xxxl },
  body: { alignItems: 'center', gap: space.s },
  badge: {
    width: size.stateBadge,
    height: size.stateBadge,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: space.xs },
  text: { maxWidth: layout.textMaxWidth },
  flex: { flex: 1 },
});
