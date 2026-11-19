import type ro from './ro';

/** Deep-widens the literal types of the Romanian dictionary: strings become `string`. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : { readonly [K in keyof T]: Widen<T[K]> };

/** Shape every UI dictionary must have (same keys as `ro.ts`). */
export type Strings = Widen<typeof ro>;

export type Language = 'ro' | 'en';
export type LanguagePreference = 'system' | Language;
