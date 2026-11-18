import type { Food } from '@/types/models';

export type BarcodeLookup =
  | { status: 'found'; food: Food }
  | { status: 'not_found' }
  | { status: 'offline' }
  | { status: 'error' };

export type SearchResult = { status: 'ok'; foods: Food[] } | { status: 'offline' } | { status: 'error' };

/** Online food data source. Screens depend on this, never on a concrete client. */
export interface FoodApi {
  lookupBarcode(barcode: string): Promise<BarcodeLookup>;
  search(query: string, limit?: number): Promise<SearchResult>;
}

const BASE_URL = 'https://world.openfoodfacts.org';
const USER_AGENT = 'Platewise/0.1 (musteatamihai2002@icloud.com)';
const TIMEOUT_MS = 10000;
const FIELDS = [
  'code',
  'product_name',
  'product_name_ro',
  'brands',
  'nutriments',
  'serving_quantity',
].join(',');

interface OffNutriments {
  'energy-kcal_100g'?: number | string;
  energy_100g?: number | string; // kJ
  proteins_100g?: number | string;
  carbohydrates_100g?: number | string;
  fat_100g?: number | string;
}

export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_ro?: string;
  brands?: string;
  nutriments?: OffNutriments;
  serving_quantity?: number | string;
}

const KJ_PER_KCAL = 4.184;

function num(value: number | string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Maps an Open Food Facts product to a Food, or null when it lacks a name or energy value. */
export function mapOffProduct(product: OffProduct, barcode?: string): Food | null {
  const code = barcode ?? product.code;
  const name = (product.product_name_ro || product.product_name || '').trim();
  const n = product.nutriments ?? {};
  const kcal = num(n['energy-kcal_100g']) ?? mapKj(num(n.energy_100g));
  if (!code || !name || kcal === undefined) return null;

  const servingGrams = num(product.serving_quantity);
  const brand = product.brands?.split(',')[0]?.trim();
  return {
    id: `off:${code}`,
    name,
    brand: brand || undefined,
    barcode: code,
    per100g: {
      kcal: Math.round(kcal),
      protein: round1(num(n.proteins_100g) ?? 0),
      carbs: round1(num(n.carbohydrates_100g) ?? 0),
      fat: round1(num(n.fat_100g) ?? 0),
    },
    servingName: servingGrams ? 'porție' : undefined,
    servingGrams: servingGrams ? Math.round(servingGrams) : undefined,
    source: 'off',
  };
}

function mapKj(kj: number | undefined): number | undefined {
  return kj === undefined ? undefined : kj / KJ_PER_KCAL;
}

class OfflineError extends Error {}

async function getJson(url: string): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    const body = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
    return { status: res.status, body };
  } catch {
    // Network failures and timeouts are both treated as offline.
    throw new OfflineError();
  } finally {
    clearTimeout(timer);
  }
}

/** Open Food Facts client, called directly from the app (demo has no backend). */
export const openFoodFactsApi: FoodApi = {
  async lookupBarcode(barcode) {
    const code = barcode.trim();
    if (!/^\d{6,14}$/.test(code)) return { status: 'not_found' };
    try {
      const { status, body } = await getJson(
        `${BASE_URL}/api/v2/product/${code}.json?fields=${FIELDS}`,
      );
      if (status === 404) return { status: 'not_found' };
      if (status >= 400) return { status: 'error' };
      const data = body as { status?: number; product?: OffProduct } | null;
      if (data?.status !== 1 || !data.product) return { status: 'not_found' };
      const food = mapOffProduct(data.product, code);
      return food ? { status: 'found', food } : { status: 'not_found' };
    } catch (e) {
      return e instanceof OfflineError ? { status: 'offline' } : { status: 'error' };
    }
  },

  async search(query, limit = 20) {
    const q = query.trim();
    if (q.length < 2) return { status: 'ok', foods: [] };
    const params = new URLSearchParams({
      search_terms: q,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: String(limit),
      fields: FIELDS,
    });
    try {
      const { status, body } = await getJson(`${BASE_URL}/cgi/search.pl?${params}`);
      if (status >= 400) return { status: 'error' };
      // When overloaded or rate-limited OFF answers 200 with an HTML "temporarily unavailable" page.
      if (body == null) return { status: 'error' };
      const products = (body as { products?: OffProduct[] }).products ?? [];
      const foods = products
        .map((p) => mapOffProduct(p))
        .filter((f): f is Food => f !== null);
      return { status: 'ok', foods };
    } catch (e) {
      return e instanceof OfflineError ? { status: 'offline' } : { status: 'error' };
    }
  },
};
