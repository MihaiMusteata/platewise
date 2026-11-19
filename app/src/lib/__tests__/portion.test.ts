import {
  clampAmount,
  convertPortion,
  foodSubtitle,
  formatAmount,
  initialPortion,
  portionLabel,
  portionUnit,
  productSubtitle,
  servingGramsOf,
  stepAmount,
  toGrams,
} from '@/lib/portion';
import type { Food } from '@/types/models';

const oats: Food = {
  id: 'common:terci',
  name: 'Terci de ovăz cu lapte',
  per100g: { kcal: 112, protein: 4, carbs: 17.6, fat: 2.8 },
  servingName: 'bol',
  servingGrams: 250,
  source: 'common',
};

describe('portion helpers', () => {
  it('converts servings to grams with one decimal', () => {
    expect(toGrams({ mode: 'servings', amount: 1.5 }, 250)).toBe(375);
    expect(toGrams({ mode: 'servings', amount: 1.5 }, 15)).toBe(22.5);
    expect(toGrams({ mode: 'servings', amount: 0.5 }, 33)).toBe(16.5);
    expect(toGrams({ mode: 'grams', amount: 120 }, 250)).toBe(120);
    expect(toGrams({ mode: 'servings', amount: 2 })).toBe(2); // no serving size: amount is grams
  });

  it('clamps and rounds amounts to their unit', () => {
    expect(clampAmount('grams', 2)).toBe(5);
    expect(clampAmount('grams', 5000)).toBe(2000);
    expect(clampAmount('grams', 22.5)).toBe(23);
    expect(clampAmount('servings', 0.2)).toBe(0.5);
    expect(clampAmount('servings', 1.3)).toBe(1.5);
    expect(clampAmount('servings', 30)).toBe(20);
    expect(clampAmount('grams', Number.NaN)).toBe(5);
  });

  it('steps within the range', () => {
    expect(stepAmount('grams', 250, 1)).toBe(260);
    expect(stepAmount('grams', 10, -1)).toBe(5);
    expect(stepAmount('grams', 1995, 1)).toBe(2000);
    expect(stepAmount('servings', 1, 1)).toBe(1.5);
    expect(stepAmount('servings', 0.5, -1)).toBe(0.5);
    expect(stepAmount('servings', 20, 1)).toBe(20);
  });

  it('switches unit keeping the quantity', () => {
    expect(convertPortion({ mode: 'servings', amount: 1.5 }, 'grams', 250)).toEqual({
      mode: 'grams',
      amount: 375,
    });
    expect(convertPortion({ mode: 'grams', amount: 300 }, 'servings', 250)).toEqual({
      mode: 'servings',
      amount: 1,
    });
    expect(convertPortion({ mode: 'grams', amount: 5 }, 'servings', 250)).toEqual({
      mode: 'servings',
      amount: 0.5,
    });
    // No serving size: stays in grams.
    expect(convertPortion({ mode: 'grams', amount: 80 }, 'servings')).toEqual({
      mode: 'grams',
      amount: 80,
    });
  });

  it('starts with one serving, or 100 g without a serving size', () => {
    expect(initialPortion(oats)).toEqual({ mode: 'servings', amount: 1 });
    expect(initialPortion({ servingGrams: undefined })).toEqual({ mode: 'grams', amount: 100 });
    expect(servingGramsOf({ servingGrams: 0 })).toBeUndefined();
  });

  it('formats amounts and units in Romanian', () => {
    expect(formatAmount(1.5)).toBe('1,5');
    expect(formatAmount(250)).toBe('250');
    expect(portionLabel({ mode: 'grams', amount: 250 })).toBe('250 g');
    expect(portionLabel({ mode: 'servings', amount: 1 }, 'bol')).toBe('1 bol');
    expect(portionLabel({ mode: 'servings', amount: 1.5 }, 'bol')).toBe('1,5 boluri');
    expect(portionUnit({ mode: 'servings', amount: 2 }, 'felie')).toBe('felii');
    expect(portionUnit({ mode: 'servings', amount: 2 }, 'unknown')).toBe('unknown');
    expect(portionUnit({ mode: 'servings', amount: 2 })).toBe('porții');
  });

  it('describes serving, brand and source under the name', () => {
    expect(foodSubtitle(oats)).toBe('1 bol = 250 g · Alimente comune');
    expect(
      foodSubtitle({
        id: 'off:1',
        name: 'Nutella',
        brand: 'Ferrero',
        per100g: oats.per100g,
        servingName: 'porție',
        servingGrams: 15,
        source: 'off',
      }),
    ).toBe('Ferrero · 1 porție = 15 g · Open Food Facts');
    expect(foodSubtitle({ ...oats, servingGrams: undefined, source: 'custom' })).toBe(
      'Alimentele mele',
    );
  });
});

describe('productSubtitle', () => {
  const nutella: Food = {
    id: 'off:3017620422003',
    name: 'Nutella',
    brand: 'Ferrero',
    barcode: '3017620422003',
    per100g: { kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
    servingName: 'porție',
    servingGrams: 15,
    source: 'off',
  };

  it('shows brand, serving and code', () => {
    expect(productSubtitle(nutella)).toBe('Ferrero · 1 porție = 15 g · Cod 3017620422003');
  });

  it('skips unknown parts', () => {
    expect(productSubtitle({ ...nutella, brand: undefined, servingGrams: undefined })).toBe(
      'Cod 3017620422003',
    );
    expect(productSubtitle({ ...nutella, barcode: undefined }, '123')).toBe(
      'Ferrero · 1 porție = 15 g · Cod 123',
    );
  });
});
