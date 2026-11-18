import {
  dedupeById,
  defaultGrams,
  matchesQuery,
  mergeResults,
  resultSubtitle,
  searchPlan,
  thumbTintFor,
} from '@/lib/search';
import type { Food } from '@/types/models';

const food = (id: string, extra: Partial<Food> = {}): Food => ({
  id,
  name: id,
  per100g: { kcal: 100, protein: 1, carbs: 1, fat: 1 },
  source: 'common',
  ...extra,
});

describe('searchPlan', () => {
  it('"Toate" with no query lists recent foods offline', () => {
    expect(searchPlan('all', '  ')).toEqual({ local: 'recent', section: 'recent', online: false });
  });

  it('"Toate" searches every local source and goes online from 2 characters', () => {
    expect(searchPlan('all', 'b')).toEqual({ local: 'search', section: 'results', online: false });
    expect(searchPlan('all', ' br ')).toEqual({ local: 'search', section: 'results', online: true });
  });

  it('"Recente" filters recent foods and never goes online', () => {
    expect(searchPlan('recent', '')).toEqual({ local: 'recent', section: 'recent', online: false });
    expect(searchPlan('recent', 'branza')).toEqual({ local: 'recent', section: 'recent', online: false });
  });

  it('"Alimentele mele" lists or searches custom foods only', () => {
    expect(searchPlan('mine', '')).toEqual({ local: 'mine', section: 'mine', online: false });
    expect(searchPlan('mine', 'paine')).toEqual({
      local: 'search',
      sources: ['custom'],
      section: 'mine',
      online: false,
    });
  });
});

describe('matchesQuery', () => {
  it('ignores case and Romanian diacritics', () => {
    expect(matchesQuery(food('x', { name: 'Brânză telemea' }), 'BRANZA')).toBe(true);
    expect(matchesQuery(food('x', { name: 'Brânză telemea' }), 'tele')).toBe(true);
    expect(matchesQuery(food('x', { name: 'Ou fiert' }), 'branza')).toBe(false);
    expect(matchesQuery(food('x'), ' ')).toBe(true);
  });
});

describe('dedupe and merge', () => {
  it('drops repeated ids and excluded ids', () => {
    const list = [food('a'), food('b'), food('a'), food('c')];
    expect(dedupeById(list).map((f) => f.id)).toEqual(['a', 'b', 'c']);
    expect(dedupeById(list, [food('b')]).map((f) => f.id)).toEqual(['a', 'c']);
  });

  it('removes online results already shown locally', () => {
    const local = [food('off:1', { source: 'off' }), food('common:x')];
    const online = [food('off:1', { source: 'off' }), food('off:2', { source: 'off' }), food('off:2')];
    const merged = mergeResults(local, online);
    expect(merged.local.map((f) => f.id)).toEqual(['off:1', 'common:x']);
    expect(merged.online.map((f) => f.id)).toEqual(['off:2']);
  });
});

describe('serving info', () => {
  it('quick add uses one serving, or 100 g without one', () => {
    expect(defaultGrams(food('a', { servingGrams: 40 }))).toBe(40);
    expect(defaultGrams(food('a'))).toBe(100);
    expect(defaultGrams(food('a', { servingGrams: 0 }))).toBe(100);
  });

  it('names the serving, shows generic portions as grams and adds the brand', () => {
    const per100g = { kcal: 129, protein: 5.4, carbs: 3.6, fat: 10 };
    expect(resultSubtitle(food('a', { per100g, servingName: 'bol', servingGrams: 150 }))).toBe(
      '1 bol · 194 kcal',
    );
    expect(
      resultSubtitle(food('a', { per100g: { ...per100g, kcal: 379 }, servingName: 'porție', servingGrams: 40 })),
    ).toBe('40 g · 152 kcal');
    expect(resultSubtitle(food('a', { per100g: { ...per100g, kcal: 2539 }, brand: 'Ferrero' }))).toBe(
      'Ferrero · 100 g · 2.539 kcal',
    );
    expect(resultSubtitle(food('a', { name: 'Almette Cremă', brand: 'Almette' }))).toBe('100 g · 100 kcal');
  });
});

describe('thumbTintFor', () => {
  it('is stable per id', () => {
    expect(thumbTintFor('common:ou-fiert')).toBe(thumbTintFor('common:ou-fiert'));
    expect(['amber', 'berry', 'blue', 'green']).toContain(thumbTintFor('off:123'));
  });
});
