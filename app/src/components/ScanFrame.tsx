import { StyleSheet, View } from 'react-native';

import { colors, radius, scan, shadow } from '@/theme';

/** Four white corner brackets with a static lime scan line (Scan.html). Decorative. */
export function ScanFrame() {
  return (
    <View
      style={styles.frame}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: scan.frameWidth, height: scan.frameHeight, alignSelf: 'center' },
  corner: {
    position: 'absolute',
    width: scan.corner,
    height: scan.corner,
    borderColor: colors.onBrand,
  },
  topLeft: {
    left: 0,
    top: 0,
    borderTopWidth: scan.cornerWidth,
    borderLeftWidth: scan.cornerWidth,
    borderTopLeftRadius: scan.cornerRadius,
  },
  topRight: {
    right: 0,
    top: 0,
    borderTopWidth: scan.cornerWidth,
    borderRightWidth: scan.cornerWidth,
    borderTopRightRadius: scan.cornerRadius,
  },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderBottomWidth: scan.cornerWidth,
    borderLeftWidth: scan.cornerWidth,
    borderBottomLeftRadius: scan.cornerRadius,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderBottomWidth: scan.cornerWidth,
    borderRightWidth: scan.cornerWidth,
    borderBottomRightRadius: scan.cornerRadius,
  },
  line: {
    position: 'absolute',
    left: scan.lineInset,
    right: scan.lineInset,
    top: scan.lineTop,
    height: scan.lineHeight,
    borderRadius: radius.xs,
    backgroundColor: colors.lime,
    ...shadow.scanLine,
  },
});
