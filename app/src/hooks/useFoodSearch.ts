import { useEffect, useMemo, useState } from 'react';

import { COMMON_FOODS, getDb, myFoods, recentFoods, searchFoods } from '@/db';
import {
  matchesQuery,
  mergeResults,
  ONLINE_DEBOUNCE_MS,
  searchPlan,
  type LocalSection,
  type SearchFilter,
} from '@/lib/search';
import { openFoodFactsApi, type FoodApi } from '@/services/foodApi';
import type { Food } from '@/types/models';

/** idle: no online search for this query · loading · done · offline / error: show the calm note. */
export type OnlineStatus = 'idle' | 'loading' | 'done' | 'offline' | 'error';

export interface FoodSearchOptions {
  api?: FoodApi;
  debounceMs?: number;
}

export interface FoodSearchResult {
  /** Heading for the local list; 'suggestions' when "Toate" has no recent foods yet. */
  section: LocalSection | 'suggestions';
  local: Food[];
  /** Open Food Facts results not already in `local`. */
  online: Food[];
  onlineStatus: OnlineStatus;
  /** True until the local list for the current query/filter has loaded (`local` may be stale). */
  loadingLocal: boolean;
}

const SUGGESTION_COUNT = 12;

/**
 * Add food search: local DB results right away (works offline), Open Food Facts results after
 * a debounce when the plan asks for them. Stale responses are ignored.
 */
export function useFoodSearch(
  query: string,
  filter: SearchFilter,
  { api = openFoodFactsApi, debounceMs = ONLINE_DEBOUNCE_MS }: FoodSearchOptions = {},
): FoodSearchResult {
  const plan = searchPlan(filter, query);
  const q = query.trim();
  const key = `${filter}\u0000${q}`;

  const [local, setLocal] = useState<{ key: string; foods: Food[]; suggestions: boolean }>();
  const [online, setOnline] = useState<{ key: string; status: OnlineStatus; foods: Food[] }>();

  useEffect(() => {
    let active = true;
    (async () => {
      const db = await getDb();
      let foods: Food[];
      let suggestions = false;
      if (plan.local === 'search') {
        foods = await searchFoods(db, q, plan.sources ? { sources: plan.sources } : {});
      } else if (plan.local === 'mine') {
        foods = await myFoods(db);
      } else {
        foods = (await recentFoods(db)).filter((food) => matchesQuery(food, q));
        if (filter === 'all' && !q && foods.length === 0) {
          foods = COMMON_FOODS.slice(0, SUGGESTION_COUNT);
          suggestions = true;
        }
      }
      if (active) setLocal({ key, foods, suggestions });
    })().catch(() => {
      if (active) setLocal({ key, foods: [], suggestions: false });
    });
    return () => {
      active = false;
    };
    // `plan` is derived from filter + q, which `key` covers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!plan.online) return;
    let active = true;
    const timer = setTimeout(() => {
      setOnline({ key, status: 'loading', foods: [] });
      api
        .search(q)
        .then((result) => {
          if (!active) return;
          if (result.status === 'ok') setOnline({ key, status: 'done', foods: result.foods });
          else setOnline({ key, status: result.status, foods: [] });
        })
        .catch(() => {
          if (active) setOnline({ key, status: 'error', foods: [] });
        });
    }, debounceMs);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, api, debounceMs]);

  const fresh = local?.key === key;
  // Keep the previous list on screen while the next one loads (no flicker while typing).
  const localFoods = local?.foods;
  const current = plan.online && online?.key === key ? online : undefined;
  // Between the keystroke and the debounced call the search is effectively pending.
  const onlineStatus: OnlineStatus = !plan.online ? 'idle' : (current?.status ?? 'loading');
  const onlineFoods = current?.foods;

  const merged = useMemo(
    () => mergeResults(localFoods ?? [], onlineFoods ?? []),
    [localFoods, onlineFoods],
  );

  return {
    section: fresh && local.suggestions ? 'suggestions' : plan.section,
    local: merged.local,
    online: merged.online,
    onlineStatus,
    loadingLocal: !fresh,
  };
}
