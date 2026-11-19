import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, router, useFocusEffect, useNavigation } from 'expo-router';
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
import { strings } from '@/i18n';
import { SCAN_BARCODE_TYPES, isValidBarcode, normalizeBarcode } from '@/lib/barcode';
import { remainingScansText, scanLimitText } from '@/lib/scanLimit';
import { getScanStatus, type ScanStatus } from '@/services/scanCounter';
import { colors, layout, radius, scan, size, space } from '@/theme';

const scannerSettings = { barcodeTypes: [...SCAN_BARCODE_TYPES] };

/** Fallback if the modal's transitionEnd event never arrives. */
const CAMERA_MOUNT_DELAY_MS = 600;

/** Barcode scanner (full-screen modal, Scan.html); CameraOff.html when access is denied. */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const navigation = useNavigation();
  const [focused, setFocused] = useState(false);
  // iOS can start the camera with a black preview when it mounts mid-transition,
  // so the preview waits until the full-screen modal has finished opening.
  const [transitionDone, setTransitionDone] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [scans, setScans] = useState<ScanStatus | null>(null);
  // Only the first scan counts; unlocked again when the screen regains focus.
  const locked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      setFocused(true);
      // Refresh the monthly counter every time the scanner comes back into view.
      let active = true;
      getScanStatus()
        .then((status) => active && setScans(status))
        .catch(() => {});
      return () => {
        active = false;
        setFocused(false);
        setTorch(false);
      };
    }, []),
  );

  useEffect(() => {
    const timer = setTimeout(() => setTransitionDone(true), CAMERA_MOUNT_DELAY_MS);
    const unsubscribe = navigation.addListener('transitionEnd' as never, () => setTransitionDone(true));
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigation]);

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

  const cameraOn = permission?.granted === true && focused && transitionDone;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ statusBarStyle: 'light' }} />
      {cameraOn ? (
        <CameraView
          // Remount when access changes (e.g. just granted) so iOS starts a fresh session.
          key={permission?.status}
          testID="scan-camera"
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={scannerSettings}
          onBarcodeScanned={manualOpen ? undefined : onBarcodeScanned}
          accessibilityLabel={strings.scan.camera}
          onMountError={(e) => console.warn('[scan] camera mount error:', e.message)}
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
            accessibilityLabel={strings.common.close}
            onPress={() => router.back()}
          />
          <AppText variant="bodyLStrong" color="onBrand" accessibilityRole="header">
            {strings.scan.title}
          </AppText>
          <IconButton
            testID="scan-torch"
            icon={Zap}
            iconSize="S"
            variant={torch ? 'darkSelected' : 'dark'}
            selected={torch}
            disabled={!cameraOn}
            accessibilityLabel={strings.scan.torch}
            onPress={() => setTorch((on) => !on)}
          />
        </View>
        <View style={styles.headerGap} />
        <ScanFrame />
        <View style={styles.instructions}>
          <AppText variant="h2" color="onBrand" align="center">
            {strings.scan.instruction}
          </AppText>
          <AppText variant="bodyL" color="scanTextSecondary" align="center">
            {strings.scan.hint}
          </AppText>
        </View>
        {scans && !scans.limitReached ? (
          <View style={styles.counter} testID="scan-remaining">
            <AppText variant="label" color="onBrand" tabular>
              {remainingScansText(scans.remaining)}
            </AppText>
          </View>
        ) : null}
        {scans?.limitReached ? (
          // Products already on the device still open without a scan, so the camera stays on.
          <View style={styles.limit} testID="scan-limit">
            <AppText variant="body" color="onBrand" align="center">
              {scanLimitText(scans.limit, new Date())}
            </AppText>
          </View>
        ) : null}
        <View style={styles.flex} />
        {scans?.limitReached ? (
          <Button
            testID="scan-search"
            variant="dark"
            label={strings.scan.searchManually}
            onPress={() => router.push('/add')}
            style={styles.search}
          />
        ) : null}
        <Button
          testID="scan-manual"
          variant="dark"
          label={strings.scan.manualEntry}
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
  counter: {
    marginTop: space.m,
    alignSelf: 'center',
    height: size.codePill,
    paddingHorizontal: space.m,
    borderRadius: radius.l,
    backgroundColor: colors.scanButton,
    justifyContent: 'center',
  },
  limit: {
    marginTop: space.m,
    padding: space.m,
    borderRadius: radius.m,
    backgroundColor: colors.scanButton,
  },
  flex: { flex: 1 },
  manual: { alignSelf: 'center' },
  search: { alignSelf: 'center', marginBottom: space.xs },
});
