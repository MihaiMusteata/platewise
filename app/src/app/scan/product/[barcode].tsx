import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarClock, CloudOff, WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  FlowHeader,
  FoodResultRow,
  LogFoodForm,
  Screen,
  StateView,
} from '@/components';
import { getDb, recentFoods } from '@/db';
import { strings } from '@/i18n';
import { defaultMealFor } from '@/lib/meals';
import { productSubtitle } from '@/lib/portion';
import { scanLimitText } from '@/lib/scanLimit';
import { defaultGrams, resultSubtitle, thumbTintFor } from '@/lib/search';
import { lookupBarcode, type ScanResult } from '@/services/barcodeLookup';
import { openFoodFactsApi } from '@/services/foodApi';
import { statusFor } from '@/services/scanCounter';
import { useLogStore } from '@/stores/log';
import { colors, space } from '@/theme';
import type { Food, Meal } from '@/types/models';

/** Recent foods offered when the lookup can't reach Open Food Facts (Offline.html shows three). */
const RECENT_LIMIT = 3;

const saveAndClose = async (food: Food, meal: Meal, grams: number) => {
  await useLogStore.getState().add({ meal, foodId: food.id, grams });
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  // Close the whole scan modal and land on Home.
  router.dismissTo('/');
};

/**
 * Scan result: looks the barcode up (device first, then Open Food Facts), then shows
 * Product found (ProductFound.html), Offline (Offline.html, also for errors) or the calm
 * scan-limit state. "Not found" replaces this screen with /scan/not-found.
 */
export default function ScanProductScreen() {
  const params = useLocalSearchParams<{ barcode: string }>();
  const barcode = typeof params.barcode === 'string' ? params.barcode : '';
  const [result, setResult] = useState<ScanResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [recent, setRecent] = useState<Food[]>([]);
  const [meal] = useState<Meal>(() => defaultMealFor(new Date()));

  useEffect(() => {
    let active = true;
    (async () => {
      const db = await getDb();
      const next = await lookupBarcode(db, openFoodFactsApi, barcode);
      if (!active) return;
      if (next.status === 'not_found') {
        router.replace({ pathname: '/scan/not-found', params: { barcode } });
        return;
      }
      if (next.status === 'offline' || next.status === 'error') {
        const foods = await recentFoods(db, RECENT_LIMIT).catch(() => []);
        if (active) setRecent(foods);
      }
      if (active) setResult(next);
    })().catch(() => {
      if (active) setResult({ status: 'error', scans: statusFor(0) });
    });
    return () => {
      active = false;
    };
  }, [barcode, attempt]);

  if (!result || result.status === 'not_found') {
    return (
      <Screen>
        <FlowHeader title={strings.scanResult.title} onBack={() => router.back()} />
        <View style={styles.loading} testID="product-loading">
          <ActivityIndicator color={colors.brand} />
          <AppText variant="body" color="textSecondary">
            {strings.scanResult.loading}
          </AppText>
        </View>
      </Screen>
    );
  }

  if (result.status === 'found') {
    const { food } = result;
    return (
      <LogFoodForm
        food={food}
        title={strings.scanResult.found.title}
        subtitle={productSubtitle(food, barcode)}
        initialMeal={meal}
        thumbSize="xl"
        gap={space.s}
        topInset
        onBack={() => router.back()}
        onSave={(chosenMeal, grams) => saveAndClose(food, chosenMeal, grams)}
        attribution={
          food.source === 'off'
            ? { text: strings.scanResult.found.attribution, position: 'below' }
            : undefined
        }
      />
    );
  }

  if (result.status === 'limit') {
    return (
      <StateView
        testID="product-limit"
        headerTitle={strings.scanResult.title}
        dismiss="back"
        onDismiss={() => router.back()}
        icon={CalendarClock}
        title={strings.scanLimit.title}
        body={scanLimitText(result.scans.limit, new Date())}
        actions={
          <>
            <Button
              testID="product-search"
              label={strings.scanResult.limit.search}
              onPress={() => router.push({ pathname: '/add', params: { meal } })}
            />
            <Button
              testID="product-close"
              variant="text"
              label={strings.common.close}
              onPress={() => router.dismissTo('/')}
            />
          </>
        }
      />
    );
  }

  // Offline or Open Food Facts not answering: same calm state, the log keeps working.
  const offline = result.status === 'offline';
  const copy = offline ? strings.scanResult.offline : strings.scanResult.error;
  return (
    <StateView
      testID={offline ? 'product-offline' : 'product-error'}
      headerTitle={strings.scanResult.title}
      dismiss="back"
      onDismiss={() => router.back()}
      icon={offline ? WifiOff : CloudOff}
      title={copy.title}
      body={copy.body}
      actions={
        <>
          <Button
            testID="product-retry"
            label={strings.scanResult.offline.retry}
            onPress={() => {
              setResult(null);
              setAttempt((n) => n + 1);
            }}
          />
          <Button
            testID="product-search"
            variant="outline"
            label={strings.scanResult.offline.searchMine}
            onPress={() => router.push({ pathname: '/add', params: { meal, filter: 'mine' } })}
          />
        </>
      }
    >
      {recent.length > 0 ? (
        <View style={styles.recent}>
          <AppText variant="overline" color="textSecondary">
            {strings.scanResult.offline.recent}
          </AppText>
          <Card padded={false}>
            {recent.map((food, index) => (
              <FoodResultRow
                key={food.id}
                testID={`product-recent-${food.id}`}
                name={food.name}
                subtitle={resultSubtitle(food)}
                tint={thumbTintFor(food.id)}
                divider={index > 0}
                quickAddLabel={strings.addFood.quickAdd(food.name)}
                onPress={() =>
                  router.push({ pathname: '/add/food/[id]', params: { id: food.id, meal } })
                }
                onQuickAdd={() => void saveAndClose(food, meal, defaultGrams(food))}
              />
            ))}
          </Card>
        </View>
      ) : null}
    </StateView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s },
  recent: { gap: space.xs, marginTop: space.xs },
});
