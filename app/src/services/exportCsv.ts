import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { allEntries, getDb } from '@/db';
import { getLanguage, strings } from '@/i18n';
import { buildLogCsv, type CsvLabels } from '@/lib/csv';
import { toDateKey } from '@/lib/date';

export type ExportResult = 'shared' | 'empty';

/** File name for the export on a given day: `platewise-jurnal-YYYY-MM-DD.csv` (en `platewise-log-…`). */
export function exportFileName(today: Date): string {
  return `${strings.csv.filePrefix}-${toDateKey(today)}.csv`;
}

/**
 * Writes the whole food log as CSV to the cache directory and opens the iOS share sheet.
 * An empty log writes nothing and returns 'empty' so the screen can explain calmly.
 */
export async function exportLogCsv(today = new Date()): Promise<ExportResult> {
  const db = await getDb();
  const entries = await allEntries(db);
  if (entries.length === 0) return 'empty';

  const file = new File(Paths.cache, exportFileName(today));
  if (file.exists) file.delete();
  file.create();
  const labels: CsvLabels = { header: strings.csv.header, meals: strings.meals };
  await file.write(buildLogCsv(entries, labels, getLanguage() === 'en' ? 'en' : 'ro'));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
  return 'shared';
}
