import { formatNumber } from '@/lib/format';
import { nutrientsFor } from '@/lib/nutrition';
import { normalizeForSearch } from '@/lib/text';
import { servingName, strings } from '@/i18n';
import type { ThumbTint } from '@/components/FoodThumb';
import type { Food } from '@/types/models';

/** Filter chips on Add food: Toate / Recente / Alimentele mele. */
export type SearchFilter = 'all' | 'recent' | 'mine';
export const SEARCH_FILTERS: readonly SearchFilter[] = ['all', 'recent', 'mine'];

/** Online search starts at this many characters (after trimming). */
export const MIN_ONLINE_QUERY = 2;
/** Wait this long after the last keystroke before calling Open Food Facts. */
export const ONLINE_DEBOUNCE_MS = 400;
/** Grams used when a food has no serving size. */
export const DEFAULT_GRAMS = 100;

/** Section heading shown above the local list. */
export type LocalSection = 'results' | 'recent' | 'mine';

export interface SearchPlan {
  /**
   * search: name search in the local DB (optionally limited to `sources`) ·
   * recent: recently used foods, filtered in memory by `query` when it is not empty ·
   * mine: foods the user created.
   */
  local: 'search' | 'recent' | 'mine';
  sources?: Food['source'][];
  section: LocalSection;
  /** Query the online API too. */
  online: boolean;
}

/** Which lists to load for a filter chip and query. */
export function searchPlan(filter: SearchFilter, query: string): SearchPlan {
  const q = query.trim();
  if (filter === 'recent') return { local: 'recent', section: 'recent', online: false };
  if (filter === 'mine') {
    return q
      ? { local: 'search', sources: ['custom'], section: 'mine', online: false }
      : { local: 'mine', section: 'mine', online: false };
  }
  return q
    ? { local: 'search', section: 'results', online: q.length >= MIN_ONLINE_QUERY }
    : { local: 'recent', section: 'recent', online: false };
}

/** Case- and diacritics-insensitive substring match on the name (same rule as the DB search). */
export function matchesQuery(food: Food, query: string): boolean {
  const q = normalizeForSearch(query);
  return q === '' || normalizeForSearch(food.name).includes(q);
}

/** Drops foods whose id was already seen (in `exclude` or earlier in the list). */
export function dedupeById(foods: Food[], exclude: Iterable<Food> = []): Food[] {
  const seen = new Set<string>();
  for (const food of exclude) seen.add(food.id);
  return foods.filter((food) => {
    if (seen.has(food.id)) return false;
    seen.add(food.id);
    return true;
  });
}

/** Online results shown after local ones: without anything already listed locally. */
export function mergeResults(local: Food[], online: Food[]): { local: Food[]; online: Food[] } {
  const uniqueLocal = dedupeById(local);
  return { local: uniqueLocal, online: dedupeById(online, uniqueLocal) };
}

/** Grams for a quick add: one serving, or 100 g when the food has no serving size. */
export function defaultGrams(food: Food): number {
  return food.servingGrams && food.servingGrams > 0 ? food.servingGrams : DEFAULT_GRAMS;
}

/**
 * Second line of a result: optional brand, the default serving and its calories, e.g.
 * "1 bol · 194 kcal", "40 g · 152 kcal", "Ferrero · 15 g · 81 kcal" (brand left out when the
 * name already contains it).
 * The generic serving name "porție" says less than its grams, so it shows as grams.
 */
export function resultSubtitle(food: Food): string {
  const grams = defaultGrams(food);
  const named = food.servingGrams && food.servingName && food.servingName !== 'porție';
  const amount = named
    ? strings.addFood.oneServing(servingName(food.servingName as string))
    : strings.addFood.grams(formatNumber(grams));
  const kcal = strings.addFood.kcal(formatNumber(nutrientsFor(food.per100g, grams).kcal));
  // Skip the brand when the name already contains it ("Almette Crema de brânză").
  const brand =
    food.brand && !normalizeForSearch(food.name).includes(normalizeForSearch(food.brand))
      ? food.brand
      : undefined;
  return [brand, amount, kcal].filter(Boolean).join(' · ');
}

const TINTS: readonly ThumbTint[] = ['amber', 'berry', 'blue', 'green'];

/** Stable thumbnail tint per food (no photos yet). */
export function thumbTintFor(id: string): ThumbTint {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}
