import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, router, useFocusEffect } from 'expo-router';
import { X, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  CameraOffState,
  IconButton,
  ManualBarcodeSheet,
  ScanFrame,
} from '@/components';
import ro from '@/i18n/ro';
import { SCAN_BARCODE_TYPES, isValidBarcode, normalizeBarcode } from '@/lib/barcode';
import { colors, layout, scan, size, space } from '@/theme';

const scannerSettings = { barcodeTypes: [...SCAN_BARCODE_TYPES] };

/** Barcode scanner (full-screen modal, Scan.html); CameraOff.html when access is denied. */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  // Only the first scan counts; unlocked again when the screen regains focus.
  const locked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      setFocused(true);
      return () => {
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  // Ask once when the user has not decided yet.
  const undetermined = permission?.status === 'undetermined';
  useEffect(() => {
    if (undetermined) requestPermission();
  }, [undetermined, requestPermission]);

  // Re-check after a trip to the Settings app.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);

  const openProduct = (barcode: string) => {
    locked.current = true;
    router.push({ pathname: '/scan/product/[barcode]', params: { barcode } });
  };

  const onBarcodeScanned = ({ data, type }: BarcodeScanningResult) => {
    if (locked.current) return;
    const code = normalizeBarcode(data, type);
    if (!isValidBarcode(code)) return; // misread: keep scanning
    locked.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    openProduct(code);
  };

  const onManualSubmit = (code: string) => {
    setManualOpen(false);
    openProduct(code);
  };

  const manualSheet = (
    <ManualBarcodeSheet
      visible={manualOpen}
      onClose={() => setManualOpen(false)}
      onSubmit={onManualSubmit}
    />
  );

  const denied = permission != null && !permission.granted && !undetermined;
  if (denied) {
    return (
      <>
        <Stack.Screen options={{ statusBarStyle: 'dark' }} />
        <CameraOffState
          onClose={() => router.back()}
          onOpenSettings={() => Linking.openSettings()}
          onManualEntry={() => setManualOpen(true)}
        />
        {manualSheet}
      </>
    );
  }

  const cameraOn = permission?.granted === true && focused;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ statusBarStyle: 'light' }} />
      {cameraOn ? (
        <CameraView
          testID="scan-camera"
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={scannerSettings}
          onBarcodeScanned={manualOpen ? undefined : onBarcodeScanned}
          accessibilityLabel={ro.scan.camera}
        />
      ) : null}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + layout.topExtra,
            paddingBottom: Math.max(insets.bottom, scan.bottomPadding),
          },
        ]}
      >
        <View style={styles.header}>
          <IconButton
            testID="scan-close"
            icon={X}
            variant="dark"
            accessibilityLabel={ro.common.close}
            onPress={() => router.back()}
          />
          <AppText variant="bodyLStrong" color="onBrand" accessibilityRole="header">
            {ro.scan.title}
          </AppText>
          <IconButton
            testID="scan-torch"
            icon={Zap}
            iconSize="S"
            variant={torch ? 'darkSelected' : 'dark'}
            selected={torch}
            disabled={!cameraOn}
            accessibilityLabel={ro.scan.torch}
            onPress={() => setTorch((on) => !on)}
          />
        </View>
        <View style={styles.headerGap} />
        <ScanFrame />
        <View style={styles.instructions}>
          <AppText variant="h2" color="onBrand" align="center">
            {ro.scan.instruction}
          </AppText>
          <AppText variant="bodyL" color="scanTextSecondary" align="center">
            {ro.scan.hint}
          </AppText>
          {/* T4.4: remaining-scans counter goes here (Scan.html has no slot for it yet). */}
        </View>
        <View style={styles.flex} />
        <Button
          testID="scan-manual"
          variant="dark"
          label={ro.scan.manualEntry}
          onPress={() => setManualOpen(true)}
          style={styles.manual}
        />
      </View>
      {manualSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.scanBackground },
  content: { flex: 1, paddingHorizontal: layout.screenPaddingX },
  header: {
    height: size.iconButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerGap: { height: scan.headerGap },
  instructions: { marginTop: scan.textGap, gap: space.xs, alignItems: 'center' },
  flex: { flex: 1 },
  manual: { alignSelf: 'center' },
});
