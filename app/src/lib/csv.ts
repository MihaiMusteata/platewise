import type { LogEntryWithFood } from '@/db/types';
import { formatDecimal } from '@/lib/format';
import type { Meal } from '@/types/models';

export interface CsvLabels {
  header: readonly string[];
  meals: Record<Meal, string>;
}

/** Quotes a field when it contains the separator, quotes or line breaks. */
function field(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Plain decimal with comma and no thousands dots, so spreadsheets read it as a number. */
function decimal(value: number, digits: number): string {
  return formatDecimal(value, digits).replace(/\./g, '');
}

/**
 * CSV of the food log for Romanian spreadsheets: `;` separator, decimal comma,
 * one row per entry, with a header row. Uses CRLF line endings.
 */
export function buildLogCsv(entries: LogEntryWithFood[], labels: CsvLabels): string {
  const rows = entries.map((e) =>
    [
      e.date,
      labels.meals[e.meal],
      e.food.name,
      e.food.brand ?? '',
      decimal(e.grams, 0),
      decimal(e.nutrients.kcal, 0),
      decimal(e.nutrients.protein, 1),
      decimal(e.nutrients.carbs, 1),
      decimal(e.nutrients.fat, 1),
    ]
      .map(field)
      .join(';'),
  );
  return [labels.header.map(field).join(';'), ...rows].join('\r\n') + '\r\n';
}
