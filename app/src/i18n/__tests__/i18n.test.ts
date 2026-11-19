import en from '@/i18n/en';
import {
  getLanguage,
  resolveLanguage,
  servingName,
  servingNamePlural,
  setLanguage,
  strings,
  subscribeLanguage,
} from '@/i18n';
import { deviceLocale } from '@/i18n/device';
import ro from '@/i18n/ro';

/** Every leaf path with its kind ("string", "function", "array[n]"), sorted. */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    return [`${path}: array[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
      .sort();
  }
  return [`${path}: ${typeof value}`];
}

afterEach(() => setLanguage('ro'));

describe('dictionaries', () => {
  it('English has exactly the same keys, kinds and list lengths as Romanian', () => {
    expect(shape(en)).toEqual(shape(ro));
  });

  it('template functions take the same number of arguments', () => {
    const arity = (d: unknown, path = ''): string[] =>
      d && typeof d === 'object'
        ? Object.entries(d).flatMap(([k, v]) => arity(v, `${path}.${k}`))
        : typeof d === 'function'
          ? [`${path}/${d.length}`]
          : [];
    expect(arity(en).sort()).toEqual(arity(ro).sort());
  });

  it('has no empty strings and no emoji', () => {
    const leaves = (d: unknown): string[] =>
      typeof d === 'string' ? [d] : d && typeof d === 'object' ? Object.values(d).flatMap(leaves) : [];
    for (const s of leaves(en)) {
      expect(s.length).toBeGreaterThan(0);
      expect(s).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});

describe('setLanguage', () => {
  it('starts in Romanian in tests', () => {
    expect(getLanguage()).toBe('ro');
    expect(strings.settings.title).toBe('Setări');
  });

  it('swaps the copy in place, so earlier references see the new language', () => {
    const settings = strings.settings;
    const sections = strings.privacy.sections;
    const listener = jest.fn();
    const unsubscribe = subscribeLanguage(listener);

    setLanguage('en');
    expect(getLanguage()).toBe('en');
    expect(settings.title).toBe('Settings');
    expect(sections[0].title).toBe('Your data stays on your phone');
    expect(strings.home.remaining('250')).toBe('250 kcal left');
    expect(listener).toHaveBeenCalledWith('en');

    setLanguage('ro');
    expect(settings.title).toBe('Setări');
    expect(strings.home.remaining('250')).toBe('250 kcal rămase');
    unsubscribe();
  });

  it('never changes the Romanian source dictionary', () => {
    setLanguage('en');
    expect(ro.settings.title).toBe('Setări');
  });
});

describe('resolveLanguage', () => {
  it('keeps an explicit choice', () => {
    expect(resolveLanguage('en', 'ro-RO')).toBe('en');
    expect(resolveLanguage('ro', 'en-US')).toBe('ro');
  });

  it('maps the device locale: ro* to Romanian, anything else to English', () => {
    expect(resolveLanguage('system', 'ro-RO')).toBe('ro');
    expect(resolveLanguage('system', 'ro-MD')).toBe('ro');
    expect(resolveLanguage('system', 'ro')).toBe('ro');
    expect(resolveLanguage('system', 'en-GB')).toBe('en');
    expect(resolveLanguage('system', 'de-DE')).toBe('en');
    expect(resolveLanguage('system', 'ru-RU')).toBe('en');
    expect(resolveLanguage('system', '')).toBe('en');
  });

  it('reads the device locale when none is given', () => {
    // jest.setup mocks the device as Romanian.
    expect(deviceLocale()).toBe('ro-RO');
    expect(resolveLanguage('system')).toBe('ro');
  });

  it('reads the locale from Intl', () => {
    const actual = jest.requireActual<typeof import('@/i18n/device')>('@/i18n/device');
    expect(typeof actual.deviceLocale()).toBe('string');
  });
});

describe('serving names', () => {
  it('shows stored Romanian serving names in the active language', () => {
    expect(servingName('felie')).toBe('felie');
    expect(servingNamePlural('felie')).toBe('felii');
    setLanguage('en');
    expect(servingName('felie')).toBe('slice');
    expect(servingNamePlural('felie')).toBe('slices');
    expect(servingName('porție')).toBe('serving');
  });

  it('falls back to the stored value for unknown names', () => {
    setLanguage('en');
    expect(servingName('borcan')).toBe('borcan');
    expect(servingNamePlural('borcan')).toBe('borcan');
  });
});
