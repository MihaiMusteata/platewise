/** Device locale (e.g. "ro-RO", "en-GB") from Hermes' Intl; empty string when unavailable. */
export function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale ?? '';
  } catch {
    return '';
  }
}
