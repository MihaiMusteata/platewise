import { mapOffProduct, openFoodFactsApi } from '@/services/foodApi';

const product = {
  code: '5941234567890',
  product_name: 'Iaurt grecesc',
  brands: 'Olympus, Olympus Foods',
  nutriments: {
    'energy-kcal_100g': 97.4,
    proteins_100g: 9.04,
    carbohydrates_100g: '3.5',
    fat_100g: 5,
  },
  serving_quantity: '150',
};

function mockFetch(status: number, body: unknown) {
  const fn = jest.fn().mockResolvedValue({
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('mapOffProduct', () => {
  it('maps per-100 g values, brand and serving', () => {
    expect(mapOffProduct(product)).toEqual({
      id: 'off:5941234567890',
      name: 'Iaurt grecesc',
      brand: 'Olympus',
      barcode: '5941234567890',
      per100g: { kcal: 97, protein: 9, carbs: 3.5, fat: 5 },
      servingName: 'porție',
      servingGrams: 150,
      source: 'off',
    });
  });
  it('prefers the Romanian name', () => {
    expect(mapOffProduct({ ...product, product_name_ro: 'Iaurt' })?.name).toBe('Iaurt');
  });
  it('falls back to kJ energy', () => {
    const food = mapOffProduct({ ...product, nutriments: { energy_100g: 418.4 } });
    expect(food?.per100g.kcal).toBe(100);
  });
  it('rejects products without name or energy', () => {
    expect(mapOffProduct({ ...product, product_name: '' })).toBeNull();
    expect(mapOffProduct({ ...product, nutriments: {} })).toBeNull();
  });
});

describe('openFoodFactsApi.lookupBarcode', () => {
  it('returns found with the Platewise User-Agent', async () => {
    const fetchMock = mockFetch(200, { status: 1, product });
    const result = await openFoodFactsApi.lookupBarcode('5941234567890');
    expect(result.status).toBe('found');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v2/product/5941234567890.json');
    expect(init.headers['User-Agent']).toBe('Platewise/0.1 (musteatamihai2002@icloud.com)');
  });
  it('returns not_found for 404 and status 0', async () => {
    mockFetch(404, { status: 0 });
    expect(await openFoodFactsApi.lookupBarcode('5941234567890')).toEqual({ status: 'not_found' });
    mockFetch(200, { status: 0 });
    expect(await openFoodFactsApi.lookupBarcode('5941234567890')).toEqual({ status: 'not_found' });
  });
  it('returns not_found for products missing nutrition', async () => {
    mockFetch(200, { status: 1, product: { ...product, nutriments: {} } });
    expect(await openFoodFactsApi.lookupBarcode('5941234567890')).toEqual({ status: 'not_found' });
  });
  it('returns offline when the network fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    expect(await openFoodFactsApi.lookupBarcode('5941234567890')).toEqual({ status: 'offline' });
  });
  it('returns error for server errors', async () => {
    mockFetch(503, null);
    expect(await openFoodFactsApi.lookupBarcode('5941234567890')).toEqual({ status: 'error' });
  });
  it('does not call the network for invalid codes', async () => {
    const fetchMock = mockFetch(200, {});
    expect(await openFoodFactsApi.lookupBarcode('abc')).toEqual({ status: 'not_found' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('openFoodFactsApi.search', () => {
  it('maps and filters results', async () => {
    mockFetch(200, { products: [product, { product_name: 'fără energie' }] });
    const result = await openFoodFactsApi.search('iaurt');
    expect(result).toEqual({ status: 'ok', foods: [expect.objectContaining({ name: 'Iaurt grecesc' })] });
  });
  it('skips very short queries', async () => {
    const fetchMock = mockFetch(200, {});
    expect(await openFoodFactsApi.search('a')).toEqual({ status: 'ok', foods: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('returns offline when the network fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    expect(await openFoodFactsApi.search('iaurt')).toEqual({ status: 'offline' });
  });
  it('treats an HTML "temporarily unavailable" page as an error, not as no results', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'text/html; charset=utf-8' },
      json: async () => ({}),
    }) as unknown as typeof fetch;
    expect(await openFoodFactsApi.search('iaurt')).toEqual({ status: 'error' });
  });
});
