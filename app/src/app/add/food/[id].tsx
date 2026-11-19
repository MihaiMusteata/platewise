import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, FlowHeader, LogFoodForm, Screen } from '@/components';
import { getDb, getFood } from '@/db';
import ro from '@/i18n/ro';
import { defaultMealFor, MEALS } from '@/lib/meals';
import { foodSubtitle } from '@/lib/portion';
import { useLogStore } from '@/stores/log';
import { space } from '@/theme';
import type { Food, Meal } from '@/types/models';

const isMeal = (value: unknown): value is Meal => MEALS.includes(value as Meal);

/**
 * Log food (LogFood.html): amount in grams or servings, live calories and macros, meal choice,
 * then "Adaugă la <masă>" saves the entry and closes the whole add flow back to Home.
 */
export default function LogFoodScreen() {
  const params = useLocalSearchParams<{ id: string; meal?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [food, setFood] = useState<Food | null | undefined>(undefined);
  const [initialMeal] = useState<Meal>(() =>
    isMeal(params.meal) ? params.meal : defaultMealFor(new Date()),
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const found = id ? await getFood(await getDb(), id) : null;
      if (active) setFood(found);
    })().catch(() => active && setFood(null));
    return () => {
      active = false;
    };
  }, [id]);

  const header = <FlowHeader title={ro.logFood.title} onBack={() => router.back()} />;

  if (food === undefined) {
    return <Screen topInset={false}>{header}</Screen>;
  }

  if (food === null) {
    return (
      <Screen topInset={false}>
        {header}
        <View style={styles.notFound} testID="log-not-found">
          <AppText variant="h3">{ro.logFood.notFoundTitle}</AppText>
          <AppText variant="bodyL" color="textSecondary">
            {ro.logFood.notFoundBody}
          </AppText>
        </View>
        <Button variant="outline" label={ro.logFood.backToSearch} onPress={() => router.back()} />
      </Screen>
    );
  }

  const save = async (meal: Meal, grams: number) => {
    await useLogStore.getState().add({ meal, foodId: food.id, grams });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Close the whole add modal (search + Log food) and land on Home.
    router.dismissTo('/');
  };

  return (
    <LogFoodForm
      food={food}
      title={ro.logFood.title}
      subtitle={foodSubtitle(food)}
      initialMeal={initialMeal}
      onBack={() => router.back()}
      onSave={save}
      attribution={
        food.source === 'off' ? { text: ro.addFood.attribution, position: 'above' } : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  notFound: { gap: space.xs },
});
