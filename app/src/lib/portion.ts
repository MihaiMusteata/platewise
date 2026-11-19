import ro from '@/i18n/ro';
import { formatDecimal } from '@/lib/format';
import { DEFAULT_GRAMS } from '@/lib/search';
import { normalizeForSearch } from '@/lib/text';
import type { Food } from '@/types/models';

/** How the amount on Log food is entered. */
export type PortionMode = 'grams' | 'servings';

export interface PortionRange {
  min: number;
  max: number;
  step: number;
}

/** Stepper ranges (LogFood.html: grams ±10 down to 5, servings ±0,5 down to 0,5). */
export const PORTION_RANGES: Record<PortionMode, PortionRange> = {
  grams: { min: 5, max: 2000, step: 10 },
  servings: { min: 0.5, max: 20, step: 0.5 },
};

export interface Portion {
  mode: PortionMode;
  amount: number;
}

/** Serving size in grams when the food has a usable one. */
export function servingGramsOf(food: Pick<Food, 'servingGrams'>): number | undefined {
  return food.servingGrams && food.servingGrams > 0 ? food.servingGrams : undefined;
}

/** Rounds to one decimal (grams are stored with at most one decimal). */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Keeps an amount inside its range and on a sensible precision: whole grams, servings in
 * multiples of the step (0,5). Non-finite values fall back to the minimum.
 */
export function clampAmount(mode: PortionMode, value: number): number {
  const { min, max, step } = PORTION_RANGES[mode];
  if (!Number.isFinite(value)) return min;
  const rounded = mode === 'grams' ? Math.round(value) : Math.round(value / step) * step;
  return Math.min(max, Math.max(min, rounded));
}

/** One stepper press: ± step, then clamped. */
export function stepAmount(mode: PortionMode, value: number, direction: 1 | -1): number {
  return clampAmount(mode, value + direction * PORTION_RANGES[mode].step);
}

/** Grams eaten for an amount (servings × serving size, one decimal). */
export function toGrams(portion: Portion, servingGrams?: number): number {
  if (portion.mode === 'grams' || !servingGrams) return round1(portion.amount);
  return round1(portion.amount * servingGrams);
}

/** Switches unit keeping roughly the same quantity, clamped to the new unit's range. */
export function convertPortion(portion: Portion, to: PortionMode, servingGrams?: number): Portion {
  if (portion.mode === to) return portion;
  const grams = toGrams(portion, servingGrams);
  if (to === 'grams') return { mode: 'grams', amount: clampAmount('grams', grams) };
  if (!servingGrams) return portion;
  return { mode: 'servings', amount: clampAmount('servings', grams / servingGrams) };
}

/** Start with one serving when the food has one, otherwise 100 g. */
export function initialPortion(food: Pick<Food, 'servingGrams'>): Portion {
  return servingGramsOf(food)
    ? { mode: 'servings', amount: 1 }
    : { mode: 'grams', amount: DEFAULT_GRAMS };
}

/** Unit after the amount: "g", or the serving name ("bol", plural "boluri" unless exactly 1). */
export function portionUnit(portion: Portion, servingName?: string): string {
  if (portion.mode === 'grams') return ro.common.grams;
  const name = servingName ?? ro.logFood.serving;
  if (portion.amount === 1) return name;
  const plurals: Record<string, string> = ro.logFood.servingPlurals;
  return plurals[name] ?? name;
}

/** Amount as shown to the user: "250", "1,5" (Romanian decimals, no trailing ",0"). */
export function formatAmount(amount: number): string {
  return formatDecimal(amount, 1, true);
}

/** "250 g", "1 bol", "1,5 boluri". */
export function portionLabel(portion: Portion, servingName?: string): string {
  return `${formatAmount(portion.amount)} ${portionUnit(portion, servingName)}`;
}

/**
 * Line under the food name on Log food: serving size, brand and source, e.g.
 * "1 bol = 250 g · Alimente comune", "Ferrero · 1 porție = 15 g · Open Food Facts".
 */
export function foodSubtitle(food: Food): string {
  const servingGrams = servingGramsOf(food);
  const serving = servingGrams
    ? ro.logFood.servingSize(food.servingName ?? ro.logFood.serving, formatAmount(servingGrams))
    : undefined;
  // Skip the brand when the name already contains it ("Almette Crema de brânză").
  const brand =
    food.brand && !normalizeForSearch(food.name).includes(normalizeForSearch(food.brand))
      ? food.brand
      : undefined;
  return [brand, serving, ro.logFood.sources[food.source]].filter(Boolean).join(' · ');
}

/**
 * Line under the product name on Product found (ProductFound.html), e.g.
 * "Ferrero · 1 porție = 15 g · Cod 3017620422003". Brand and serving are skipped when unknown.
 */
export function productSubtitle(food: Food, barcode?: string): string {
  const servingGrams = servingGramsOf(food);
  const serving = servingGrams
    ? ro.logFood.servingSize(food.servingName ?? ro.logFood.serving, formatAmount(servingGrams))
    : undefined;
  const brand =
    food.brand && !normalizeForSearch(food.name).includes(normalizeForSearch(food.brand))
      ? food.brand
      : undefined;
  const code = barcode ?? food.barcode;
  return [brand, serving, code ? ro.scanResult.code(code) : undefined].filter(Boolean).join(' · ');
}
