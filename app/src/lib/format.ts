import { getLanguage } from '@/i18n';

/** Thousands and decimal separators of the active language: ro "2.000" / "72,4", en "2,000" / "72.4". */
function separators(): { group: string; decimal: string } {
  return getLanguage() === 'en' ? { group: ',', decimal: '.' } : { group: '.', decimal: ',' };
}

/** Groups the integer part: 2000 → "2.000" (ro) or "2,000" (en). */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separators().group);
}

/** Integer in the active language: rounds, thousands grouped ("2.000" ro, "2,000" en). */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return sign + groupThousands(String(Math.abs(rounded)));
}

/**
 * Decimal in the active language: ro "72,4", "1.234,5"; en "72.4", "1,234.5".
 * `digits` decimals are always shown unless `trimZeros` drops a trailing zero ("3" instead of "3,0").
 */
export function formatDecimal(value: number, digits = 1, trimZeros = false): string {
  const fixed = Math.abs(value).toFixed(digits);
  const [int, frac] = fixed.split('.');
  const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
  const fraction = frac && !(trimZeros && /^0+$/.test(frac)) ? `${separators().decimal}${frac}` : '';
  return sign + groupThousands(int) + fraction;
}

/** Parses user input in Romanian or English decimal notation ("72,4" or "72.4"). NaN if invalid. */
export function parseDecimal(input: string): number {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;
  return Number(normalized);
}
