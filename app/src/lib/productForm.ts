import { randomUUID } from 'expo-crypto';

import { parseDecimal } from '@/lib/format';
import { DEFAULT_SERVING_NAME } from '@/lib/portion';
import type { Food, Nutrients } from '@/types/models';

export const NAME_MAX = 80;
export const BRAND_MAX = 80;
export const KCAL_MAX = 900;
export const MACRO_MAX = 100;
export const SERVING_MIN = 1;
export const SERVING_MAX = 2000;
/** kcal vs 4/4/9 × macros: hint only when it differs by more than 20 % and more than 30 kcal. */
export const MISMATCH_RATIO = 0.2;
export const MISMATCH_KCAL = 30;

/** Add product form, text kept as typed (per 100 g; serving in grams). */
export interface ProductFormValues {
  name: string;
  brand: string;
  servingGrams: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  brand: '',
  servingGrams: '',
  kcal: '',
  protein: '',
  carbs: '',
  fat: '',
};

export type ProductField = keyof ProductFormValues;

/** Message keys in `strings.addProduct.errors`. */
export type ProductErrorKey = 'name' | 'serving' | 'kcal' | 'macro' | 'macroSum';

/** Parsed, valid product data. */
export interface ProductData {
  name: string;
  brand?: string;
  servingGrams?: number;
  per100g: Nutrients;
}

export interface ProductFormResult {
  /** True when the product can be saved. */
  valid: boolean;
  /** Visible field errors (empty required fields only keep the button disabled). */
  errors: Partial<Record<ProductField, ProductErrorKey>>;
  /** Protein + carbs + fat above 100 g per 100 g. */
  macroSumError: boolean;
  /** Calm, non-blocking hint: kcal far from 4/4/9 × macros. */
  kcalMismatch: boolean;
  /** Calories from the entered macros (4/4/9), for the hint. */
  kcalEstimate: number;
  data: ProductData | null;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Empty → `empty`; otherwise the parsed number when within [min, max], else NaN. */
function parseRange(text: string, min: number, max: number): number | 'empty' {
  if (text.trim() === '') return 'empty';
  const value = parseDecimal(text);
  return Number.isNaN(value) || value < min || value > max ? NaN : value;
}

/** Calories estimated from macros (4 kcal/g protein and carbs, 9 kcal/g fat). */
export function kcalFromMacros(protein: number, carbs: number, fat: number): number {
  return protein * 4 + carbs * 4 + fat * 9;
}

/** True when kcal differs from the macro estimate by > 20 % and > 30 kcal. */
export function isKcalMismatch(kcal: number, macros: Omit<Nutrients, 'kcal'>): boolean {
  const estimate = kcalFromMacros(macros.protein, macros.carbs, macros.fat);
  const diff = Math.abs(kcal - estimate);
  return diff > MISMATCH_KCAL && diff > kcal * MISMATCH_RATIO;
}

/**
 * Validates the Add product form. Name 1–80 chars (trimmed) and kcal 0–900 are required;
 * protein, carbs and fat are 0–100 g each (empty = 0) and together at most 100 g;
 * serving 1–2000 g is optional. Decimals with comma or dot.
 */
export function validateProductForm(values: ProductFormValues): ProductFormResult {
  const errors: ProductFormResult['errors'] = {};

  const name = values.name.trim();
  if (name.length > NAME_MAX) errors.name = 'name';

  const kcal = parseRange(values.kcal, 0, KCAL_MAX);
  if (Number.isNaN(kcal)) errors.kcal = 'kcal';

  const serving = parseRange(values.servingGrams, SERVING_MIN, SERVING_MAX);
  if (Number.isNaN(serving)) errors.servingGrams = 'serving';

  const macros = { protein: 0, carbs: 0, fat: 0 };
  let macrosValid = true;
  for (const key of ['protein', 'carbs', 'fat'] as const) {
    const value = parseRange(values[key], 0, MACRO_MAX);
    if (Number.isNaN(value)) {
      errors[key] = 'macro';
      macrosValid = false;
    } else if (value !== 'empty') {
      macros[key] = round1(value);
    }
  }
  const macroSumError = macrosValid && macros.protein + macros.carbs + macros.fat > MACRO_MAX;
  const anyMacro = ['protein', 'carbs', 'fat'].some(
    (key) => values[key as ProductField].trim() !== '',
  );

  const kcalOk = typeof kcal === 'number' && !Number.isNaN(kcal);
  const kcalMismatch =
    kcalOk && macrosValid && !macroSumError && anyMacro && isKcalMismatch(kcal, macros);

  const valid =
    name.length > 0 && kcalOk && Object.keys(errors).length === 0 && !macroSumError;

  const brand = values.brand.trim();
  const data: ProductData | null = valid
    ? {
        name,
        ...(brand ? { brand: brand.slice(0, BRAND_MAX) } : {}),
        ...(typeof serving === 'number' ? { servingGrams: round1(serving) } : {}),
        per100g: { kcal: round1(kcal as number), ...macros },
      }
    : null;

  const kcalEstimate = kcalFromMacros(macros.protein, macros.carbs, macros.fat);
  return { valid, errors, macroSumError, kcalMismatch, kcalEstimate, data };
}

/** A user-created food: random uuid id (never `off:`), `source: 'custom'`, serving named "porție". */
export function buildCustomFood(data: ProductData, barcode?: string): Food {
  const food: Food = {
    id: randomUUID(),
    name: data.name,
    per100g: { ...data.per100g },
    source: 'custom',
  };
  if (data.brand) food.brand = data.brand;
  if (barcode) food.barcode = barcode;
  if (data.servingGrams) {
    food.servingName = DEFAULT_SERVING_NAME;
    food.servingGrams = data.servingGrams;
  }
  return food;
}
