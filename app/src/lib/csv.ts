import type { LogEntryWithFood } from '@/db/types';
import type { Language } from '@/i18n';
import type { Meal } from '@/types/models';

export interface CsvLabels {
  header: readonly string[];
  meals: Record<Meal, string>;
}

/**
 * Spreadsheet conventions per language: Romanian spreadsheets expect `;` and a decimal comma,
 * English ones `,` and a decimal point.
 */
const FORMATS: Record<Language, { separator: string; decimal: string }> = {
  ro: { separator: ';', decimal: ',' },
  en: { separator: ',', decimal: '.' },
};

/** Quotes a field when it contains the separator, quotes or line breaks. */
function field(value: string, separator: string): string {
  return value.includes(separator) || /["\n\r]/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

/**
 * CSV of the food log: one row per entry, with a header row, CRLF line endings. Numbers are
 * plain (no thousands separators) so spreadsheets read them as numbers. `format` 'ro' (default)
 * uses `;` and a decimal comma, 'en' uses `,` and a decimal point.
 */
export function buildLogCsv(
  entries: LogEntryWithFood[],
  labels: CsvLabels,
  format: Language = 'ro',
): string {
  const { separator, decimal: mark } = FORMATS[format];
  const decimal = (value: number, digits: number) => value.toFixed(digits).replace('.', mark);
  const row = (fields: readonly string[]) => fields.map((f) => field(f, separator)).join(separator);
  const rows = entries.map((e) =>
    row([
      e.date,
      labels.meals[e.meal],
      e.food.name,
      e.food.brand ?? '',
      decimal(e.grams, 0),
      decimal(e.nutrients.kcal, 0),
      decimal(e.nutrients.protein, 1),
      decimal(e.nutrients.carbs, 1),
      decimal(e.nutrients.fat, 1),
    ]),
  );
  return [row(labels.header), ...rows].join('\r\n') + '\r\n';
}
