import ro from '@/i18n/ro';
import { formatDayMonth } from '@/lib/date';
import { formatNumber } from '@/lib/format';

export interface PluralForms {
  /** Exactly 1: "scanare". */
  one: string;
  /** 0, 2–19 and numbers ending in 01–19 above 100: "scanări". */
  few: string;
  /** 20 and up (except the endings above): "de scanări". */
  other: string;
}

/** Romanian plural form for a count (1 scanare, 7 scanări, 20 de scanări, 101 de scanări… 102 scanări). */
export function pluralRo(count: number, forms: PluralForms): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return forms.one;
  const lastTwo = n % 100;
  if (n === 0 || (lastTwo >= 1 && lastTwo <= 19)) return forms.few;
  return forms.other;
}

/** "7 scanări rămase luna aceasta", "1 scanare rămasă luna aceasta", "20 de scanări rămase…". */
export function remainingScansText(remaining: number): string {
  const forms = ro.scanLimit.remaining;
  return `${formatNumber(remaining)} ${pluralRo(remaining, forms)}`;
}

/** First day of the next calendar month (local), when the monthly scans come back. */
export function nextScanReset(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/** Calm limit message: "Ai folosit cele 10 scanări din luna aceasta. … revin pe 1 decembrie." */
export function scanLimitText(limit: number, now: Date): string {
  return ro.scanLimit.body(formatNumber(limit), formatDayMonth(nextScanReset(now)));
}
