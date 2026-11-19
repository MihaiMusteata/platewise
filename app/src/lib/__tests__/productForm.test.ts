import {
  buildCustomFood,
  EMPTY_PRODUCT_FORM,
  isKcalMismatch,
  validateProductForm,
  type ProductFormValues,
} from '@/lib/productForm';

let mockUuid = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `uuid-${++mockUuid}` }));

const granola: ProductFormValues = {
  name: '  Granola cu ovăz și miere ',
  brand: '',
  servingGrams: '40',
  kcal: '452',
  protein: '8,5',
  carbs: '63',
  fat: '17',
};

const withValues = (patch: Partial<ProductFormValues>) => validateProductForm({ ...granola, ...patch });

describe('validateProductForm', () => {
  it('accepts the label values with comma decimals and trims the name', () => {
    const result = validateProductForm(granola);
    expect(result).toMatchObject({ valid: true, errors: {}, macroSumError: false, kcalMismatch: false });
    expect(result.data).toEqual({
      name: 'Granola cu ovăz și miere',
      servingGrams: 40,
      per100g: { kcal: 452, protein: 8.5, carbs: 63, fat: 17 },
    });
  });

  it('keeps an empty form invalid without showing errors', () => {
    expect(validateProductForm(EMPTY_PRODUCT_FORM)).toMatchObject({ valid: false, errors: {} });
    expect(withValues({ name: '   ' })).toMatchObject({ valid: false, errors: {} });
    expect(withValues({ kcal: '' })).toMatchObject({ valid: false, errors: {} });
  });

  it('limits the name to 80 characters', () => {
    expect(withValues({ name: 'a'.repeat(80) }).valid).toBe(true);
    expect(withValues({ name: 'a'.repeat(81) })).toMatchObject({ valid: false, errors: { name: 'name' } });
  });

  it('checks kcal 0–900', () => {
    expect(withValues({ kcal: '0', protein: '', carbs: '', fat: '' }).valid).toBe(true);
    expect(withValues({ kcal: '900', fat: '100', protein: '', carbs: '' }).valid).toBe(true);
    expect(withValues({ kcal: '901' })).toMatchObject({ valid: false, errors: { kcal: 'kcal' } });
    expect(withValues({ kcal: 'abc' }).errors.kcal).toBe('kcal');
  });

  it('checks each macro 0–100 g and treats empty as 0', () => {
    expect(withValues({ protein: '101' }).errors.protein).toBe('macro');
    expect(withValues({ fat: '-1' }).errors.fat).toBe('macro');
    const empty = withValues({ kcal: '0', protein: '', carbs: '', fat: '' });
    expect(empty.data?.per100g).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('rejects macros adding up to more than 100 g', () => {
    const result = withValues({ protein: '40', carbs: '40', fat: '20,5' });
    expect(result).toMatchObject({ valid: false, macroSumError: true, errors: {} });
    expect(withValues({ kcal: '540', protein: '40', carbs: '40', fat: '20' }).valid).toBe(true);
  });

  it('checks the optional serving 1–2000 g', () => {
    expect(withValues({ servingGrams: '' }).data?.servingGrams).toBeUndefined();
    expect(withValues({ servingGrams: '2000' }).valid).toBe(true);
    expect(withValues({ servingGrams: '0' }).errors.servingGrams).toBe('serving');
    expect(withValues({ servingGrams: '2001' }).errors.servingGrams).toBe('serving');
  });

  it('hints, without blocking, when kcal is far from the macros', () => {
    const result = withValues({ kcal: '200' }); // macros give 439 kcal
    expect(result).toMatchObject({ valid: true, kcalMismatch: true, kcalEstimate: 439 });
    expect(withValues({ kcal: '200', protein: '', carbs: '', fat: '' }).kcalMismatch).toBe(false);
  });
});

describe('isKcalMismatch', () => {
  it('needs more than 20 % and more than 30 kcal', () => {
    const macros = { protein: 10, carbs: 10, fat: 0 }; // 80 kcal
    expect(isKcalMismatch(115, macros)).toBe(true); // 35 kcal, 30 %
    expect(isKcalMismatch(105, macros)).toBe(false); // 25 kcal
    const big = { protein: 0, carbs: 100, fat: 0 }; // 400 kcal
    expect(isKcalMismatch(450, big)).toBe(false); // 50 kcal but 11 %
  });
});

describe('buildCustomFood', () => {
  beforeEach(() => {
    mockUuid = 0;
  });

  it('builds a custom food with a uuid, barcode, brand and a "porție" serving', () => {
    const { data } = withValues({ brand: ' Fitness ' });
    expect(buildCustomFood(data!, '4000000000000')).toEqual({
      id: 'uuid-1',
      name: 'Granola cu ovăz și miere',
      brand: 'Fitness',
      barcode: '4000000000000',
      per100g: { kcal: 452, protein: 8.5, carbs: 63, fat: 17 },
      servingName: 'porție',
      servingGrams: 40,
      source: 'custom',
    });
  });

  it('leaves out barcode and serving when not given', () => {
    const food = buildCustomFood(withValues({ servingGrams: '' }).data!);
    expect(food).not.toHaveProperty('barcode');
    expect(food).not.toHaveProperty('servingGrams');
    expect(food.id.startsWith('off:')).toBe(false);
  });
});
