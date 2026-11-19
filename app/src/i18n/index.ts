import { deviceLocale } from './device';
import en from './en';
import ro from './ro';
import type { Language, LanguagePreference, Strings } from './types';

export type { Language, LanguagePreference, Strings } from './types';

const dictionaries: Record<Language, Strings> = { ro, en };

type Mutable = Record<string, unknown> | unknown[];

const isContainer = (value: unknown): value is Mutable =>
  typeof value === 'object' && value !== null;

/** Copies `source` into `target` in place: nested objects and arrays keep their identity. */
function assignDeep(target: Mutable, source: Mutable): void {
  if (Array.isArray(target) && Array.isArray(source)) target.length = source.length;
  const t = target as Record<string, unknown>;
  for (const [key, value] of Object.entries(source)) {
    if (isContainer(value)) {
      if (!isContainer(t[key]) || Array.isArray(t[key]) !== Array.isArray(value)) {
        t[key] = Array.isArray(value) ? [] : {};
      }
      assignDeep(t[key] as Mutable, value);
    } else {
      t[key] = value;
    }
  }
}

function cloneDeep<T>(value: T): T {
  const copy = (Array.isArray(value) ? [] : {}) as Mutable;
  assignDeep(copy, value as Mutable);
  return copy as T;
}

/**
 * The active UI copy. A single live object: `setLanguage` rewrites it in place, so references
 * taken earlier (e.g. `const t = strings.settings` at module level) see the new language.
 * Note that a string copied out of it (`const label = strings.x.y`) does not change.
 */
export const strings: Strings = cloneDeep(ro);

let current: Language = 'ro';
const listeners = new Set<(language: Language) => void>();

export function getLanguage(): Language {
  return current;
}

/** Switches the UI copy and number/date formats. No-op when already active. */
export function setLanguage(language: Language): void {
  if (language === current) return;
  current = language;
  assignDeep(strings as unknown as Mutable, dictionaries[language] as unknown as Mutable);
  listeners.forEach((listener) => listener(language));
}

/** Called after every language change; returns an unsubscribe function. */
export function subscribeLanguage(listener: (language: Language) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 'system' follows the phone: Romanian for any `ro*` locale, English for everything else. */
export function resolveLanguage(preference: LanguagePreference, locale = deviceLocale()): Language {
  if (preference !== 'system') return preference;
  return locale.toLowerCase().startsWith('ro') ? 'ro' : 'en';
}

/** Serving names are stored in Romanian ("felie"); this is how one reads in the active language. */
export function servingName(stored: string): string {
  const names: Readonly<Record<string, string>> = strings.logFood.servingNames;
  return names[stored] ?? stored;
}

/** Plural of a stored serving name ("felie" → "felii" / "slices"). */
export function servingNamePlural(stored: string): string {
  const plurals: Readonly<Record<string, string>> = strings.logFood.servingPlurals;
  return plurals[stored] ?? servingName(stored);
}
