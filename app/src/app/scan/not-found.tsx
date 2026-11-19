import { router, useLocalSearchParams } from 'expo-router';
import { Plus, ScanBarcode } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, StateView } from '@/components';
import { strings } from '@/i18n';
import { colors, radius, shadow, size, space } from '@/theme';

/** Scan: product not in Open Food Facts (ScanNotFound.html). */
export default function ScanNotFoundScreen() {
  const params = useLocalSearchParams<{ barcode?: string }>();
  const barcode = typeof params.barcode === 'string' ? params.barcode : '';

  return (
    <StateView
      testID="not-found"
      headerTitle={strings.scanResult.title}
      dismiss="back"
      onDismiss={() => router.back()}
      icon={ScanBarcode}
      tone="mint"
      title={strings.scanResult.notFound.title}
      body={strings.scanResult.notFound.body}
      actions={
        <>
          <Button
            testID="not-found-add"
            icon={Plus}
            label={strings.scanResult.notFound.addProduct}
            onPress={() =>
              router.push({ pathname: '/scan/new-product', params: barcode ? { barcode } : {} })
            }
          />
          <Button
            testID="not-found-search"
            variant="outline"
            label={strings.scanResult.notFound.search}
            onPress={() => router.push('/add')}
          />
          <Button
            testID="not-found-rescan"
            variant="text"
            label={strings.scanResult.notFound.scanAgain}
            onPress={() => router.back()}
          />
        </>
      }
    >
      {barcode ? (
        <View style={styles.codeRow}>
          <View style={styles.code}>
            <AppText variant="label" tabular testID="not-found-code">
              {strings.scanResult.code(barcode)}
            </AppText>
          </View>
        </View>
      ) : null}
    </StateView>
  );
}

const styles = StyleSheet.create({
  codeRow: { alignItems: 'center' },
  code: {
    height: size.codePill,
    paddingHorizontal: space.m,
    borderRadius: radius.l,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    ...shadow.card,
  },
});
