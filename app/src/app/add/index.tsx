import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { CloudOff, Plus, ScanBarcode } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Card,
  Chip,
  FoodResultRow,
  IconButton,
  Screen,
  SearchField,
  Snackbar,
} from '@/components';
import { getDb, upsertFood } from '@/db';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useUndoSnackbar } from '@/hooks/useUndoSnackbar';
import ro from '@/i18n/ro';
import { defaultMealFor, MEALS } from '@/lib/meals';
import {
  defaultGrams,
  resultSubtitle,
  SEARCH_FILTERS,
  thumbTintFor,
  type SearchFilter,
} from '@/lib/search';
import { useLogStore } from '@/stores/log';
import { colors, iconStroke, layout, opacity, size, space } from '@/theme';
import type { Food, Meal } from '@/types/models';

const isMeal = (value: unknown): value is Meal => MEALS.includes(value as Meal);
const isFilter = (value: unknown): value is SearchFilter =>
  SEARCH_FILTERS.includes(value as SearchFilter);

/** Caches an Open Food Facts result locally so Log food, the log and "Recente" can use it offline. */
async function ensureCached(food: Food): Promise<void> {
  if (food.source !== 'off') return;
  await upsertFood(await getDb(), food);
}

/**
 * Add food — search (AddFood.html). Local results (common foods, my foods, recent) work
 * offline; under "Toate" a debounced Open Food Facts search adds a second section.
 * Row → Log food; plus → quick add one serving to the current meal with an undo snackbar.
 */
export default function AddFoodScreen() {
  const params = useLocalSearchParams<{ meal?: string; filter?: string }>();
  const [meal] = useState<Meal>(() => (isMeal(params.meal) ? params.meal : defaultMealFor(new Date())));
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>(() =>
    isFilter(params.filter) ? params.filter : 'all',
  );
  const [addedId, setAddedId] = useState<string | null>(null);
  const search = useFoodSearch(query, filter);
  const snackbar = useUndoSnackbar();
  const insets = useSafeAreaInsets();
  const q = query.trim();

  const openFood = async (food: Food) => {
    await ensureCached(food).catch(() => {});
    router.push({ pathname: '/add/food/[id]', params: { id: food.id, meal } });
  };

  const quickAdd = async (food: Food) => {
    try {
      await ensureCached(food);
      const entry = await useLogStore
        .getState()
        .add({ meal, foodId: food.id, grams: defaultGrams(food) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAddedId(food.id);
      snackbar.show(ro.addFood.added(food.name), () => {
        setAddedId(null);
        void useLogStore.getState().remove(entry.id);
      });
    } catch {
      // Saving locally practically never fails; the row simply stays un-checked.
    }
  };

  const renderRows = (foods: Food[], prefix: string) => (
    <Card padded={false}>
      {foods.map((food, index) => (
        <FoodResultRow
          key={food.id}
          testID={`${prefix}-${food.id}`}
          name={food.name}
          subtitle={resultSubtitle(food)}
          tint={thumbTintFor(food.id)}
          divider={index > 0}
          added={snackbar.current != null && addedId === food.id}
          quickAddLabel={ro.addFood.quickAdd(food.name)}
          addedLabel={ro.addFood.addedLabel(food.name)}
          onPress={() => void openFood(food)}
          onQuickAdd={() => void quickAdd(food)}
        />
      ))}
    </Card>
  );

  const localEmpty = !search.loadingLocal && search.local.length === 0;
  const onlineBusy = search.onlineStatus === 'loading';
  // Only say "nothing found" once every source answered (an offline note covers the rest).
  const onlineSettled = search.onlineStatus === 'idle' || search.onlineStatus === 'done';
  let emptyText: string | null = null;
  if (localEmpty) {
    if (q && onlineSettled && search.online.length === 0) emptyText = ro.addFood.noResults(q);
    else if (!q && search.section === 'recent') emptyText = ro.addFood.emptyRecent;
    else if (!q && search.section === 'mine') emptyText = ro.addFood.emptyMine;
  }

  return (
    <View style={styles.root}>
      <Screen
        scroll
        topInset={false}
        contentStyle={snackbar.current ? styles.contentWithSnackbar : undefined}
      >
        <View style={styles.header}>
          <AppText variant="h1" accessibilityRole="header" style={styles.title}>
            {ro.addFood.title}
          </AppText>
          <Pressable
            testID="add-done"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={ro.addFood.done}
            hitSlop={space.xs}
            style={({ pressed }) => [styles.done, pressed && styles.pressed]}
          >
            <AppText variant="button" color="brand">
              {ro.addFood.done}
            </AppText>
          </Pressable>
        </View>
        <AppText variant="body" color="textSecondary" style={styles.subtitle} testID="add-meal">
          {`${ro.addFood.addingTo} `}
          <AppText variant="bodyStrong">{ro.meals[meal]}</AppText>
        </AppText>

        <View style={styles.searchRow}>
          <SearchField
            testID="add-search"
            label={ro.addFood.searchLabel}
            value={query}
            onChangeText={setQuery}
          />
          <IconButton
            testID="add-scan"
            icon={ScanBarcode}
            variant="brand"
            buttonSize="l"
            accessibilityLabel={ro.addFood.scan}
            onPress={() => router.push('/scan')}
          />
        </View>

        <View style={styles.chips} accessibilityLabel={ro.addFood.filterGroup}>
          {SEARCH_FILTERS.map((f) => (
            <Chip
              key={f}
              testID={`filter-${f}`}
              label={ro.addFood.filters[f]}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>

        {search.local.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="overline" color="textSecondary">
              {ro.addFood.sections[search.section]}
            </AppText>
            {renderRows(search.local, 'result')}
          </View>
        ) : null}

        {emptyText ? (
          <AppText variant="body" color="textSecondary" testID="add-empty">
            {emptyText}
          </AppText>
        ) : null}

        {onlineBusy && q ? (
          <View style={styles.note} testID="add-online-loading">
            <ActivityIndicator color={colors.textSecondary} />
            <AppText variant="body" color="textSecondary">
              {ro.addFood.searchingOnline}
            </AppText>
          </View>
        ) : null}

        {search.onlineStatus === 'offline' || search.onlineStatus === 'error' ? (
          <View style={styles.note} testID="add-online-note" accessibilityLiveRegion="polite">
            <CloudOff size={size.iconS} color={colors.textSecondary} strokeWidth={iconStroke.thin} />
            <AppText variant="body" color="textSecondary" style={styles.noteText}>
              {search.onlineStatus === 'offline' ? ro.addFood.offline : ro.addFood.onlineError}
            </AppText>
          </View>
        ) : null}

        {search.online.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="overline" color="textSecondary">
              {ro.addFood.sections.online}
            </AppText>
            {renderRows(search.online, 'online')}
            <AppText variant="caption" color="textSecondary" testID="add-attribution">
              {ro.addFood.attribution}
            </AppText>
          </View>
        ) : null}

        <Button
          testID="add-create"
          variant="outline"
          icon={Plus}
          label={ro.addFood.create}
          onPress={() => router.push('/scan/new-product')}
        />
      </Screen>

      {snackbar.current ? (
        <Snackbar
          testID="add-snackbar"
          message={snackbar.current.message}
          onAction={snackbar.undo}
          style={[styles.snackbar, { bottom: insets.bottom + space.m }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  contentWithSnackbar: { paddingBottom: size.snackbar + space.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.m,
  },
  title: { flexShrink: 1 },
  done: { minHeight: size.minTouch, justifyContent: 'center' },
  pressed: { opacity: opacity.pressed },
  // The design pulls the meal line 8 closer to the title.
  subtitle: { marginTop: -space.xs },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  // Overline label sits 8 above its card.
  section: { gap: space.xs },
  note: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  noteText: { flex: 1 },
  snackbar: { position: 'absolute', left: layout.screenPaddingX, right: layout.screenPaddingX },
});
