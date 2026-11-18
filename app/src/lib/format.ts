/** Groups the integer part with dots: 2000 → "2.000". */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Romanian integer format: rounds, thousands separated by dot ("2.000", "-1.250"). */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return sign + groupThousands(String(Math.abs(rounded)));
}

/**
 * Romanian decimal format with a comma ("72,4", "1.234,5").
 * `digits` decimals are always shown unless `trimZeros` drops a trailing ",0" ("3" instead of "3,0").
 */
export function formatDecimal(value: number, digits = 1, trimZeros = false): string {
  const fixed = Math.abs(value).toFixed(digits);
  const [int, frac] = fixed.split('.');
  const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
  const fraction = frac && !(trimZeros && /^0+$/.test(frac)) ? `,${frac}` : '';
  return sign + groupThousands(int) + fraction;
}

/** Parses user input in Romanian or English decimal notation ("72,4" or "72.4"). NaN if invalid. */
export function parseDecimal(input: string): number {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;
  return Number(normalized);
}
