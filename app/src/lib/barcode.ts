/**
 * Barcode helpers for retail product codes (GTIN-8 / EAN-8, GTIN-12 / UPC-A, GTIN-13 / EAN-13,
 * UPC-E). Canonical form used across the app (routes, lookups, cache keys):
 * - EAN-13 stays 13 digits; EAN-8 stays 8 digits;
 * - UPC-A (12 digits) gets a leading 0 → 13 digits (how Open Food Facts stores it, and how iOS
 *   already reports UPC-A: as an EAN-13 with a leading 0);
 * - UPC-E (8 digits, only when the scanner says so) is expanded to UPC-A, then padded to 13.
 */

/** Lengths accepted for manual entry and scans. */
export const BARCODE_LENGTHS = [8, 12, 13] as const;

/** Barcode types the scanner listens for (expo-camera `BarcodeType`). */
export const SCAN_BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

/** GTIN mod-10 check: weights 3,1,3,1… from the right, excluding the check digit. */
export function gtinCheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = body.charCodeAt(body.length - 1 - i) - 48;
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/** True for an 8, 12 or 13 digit code whose last digit is the correct GTIN check digit. */
export function isValidBarcode(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  if (!(BARCODE_LENGTHS as readonly number[]).includes(code.length)) return false;
  return gtinCheckDigit(code.slice(0, -1)) === Number(code[code.length - 1]);
}

/** Whether a scanner type string means UPC-E ("upc_e", "upce", "org.gs1.UPC-E"…). */
function isUpcEType(type: string | undefined): boolean {
  return type != null && /upc[-_]?e$/i.test(type);
}

/**
 * Expands an 8-digit UPC-E (number system + 6 digits + check) to its 12-digit UPC-A.
 * Returns null when the input is not an 8-digit UPC-E with number system 0 or 1.
 */
export function expandUpcE(code: string): string | null {
  if (!/^[01]\d{7}$/.test(code)) return null;
  const ns = code[0];
  const d = code.slice(1, 7);
  const check = code[7];
  const last = Number(d[5]);
  let body: string;
  if (last <= 2) body = `${d[0]}${d[1]}${d[5]}0000${d[2]}${d[3]}${d[4]}`;
  else if (last === 3) body = `${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`;
  else if (last === 4) body = `${d[0]}${d[1]}${d[2]}${d[3]}00000${d[4]}`;
  else body = `${d.slice(0, 5)}0000${d[5]}`;
  return `${ns}${body}${check}`;
}

/**
 * Turns a scanned or typed code into the canonical form above. Strips spaces and dashes.
 * `type` is the scanner's barcode type, when known (needed to tell UPC-E from EAN-8).
 * The result is not validated; call `isValidBarcode` on it.
 */
export function normalizeBarcode(raw: string, type?: string): string {
  const digits = raw.replace(/[\s-]/g, '');
  if (isUpcEType(type)) {
    const upcA = expandUpcE(digits);
    if (upcA) return `0${upcA}`;
  }
  if (/^\d{12}$/.test(digits)) return `0${digits}`;
  return digits;
}

export type BarcodeEntryError = 'format' | 'checkDigit';

/**
 * Validates a typed code. `format`: not 8, 12 or 13 digits; `checkDigit`: right length but the
 * check digit does not match (usually a typo). Returns the canonical code when valid.
 */
export function checkBarcodeEntry(
  input: string,
): { ok: true; code: string } | { ok: false; error: BarcodeEntryError } {
  const raw = input.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(raw) || !(BARCODE_LENGTHS as readonly number[]).includes(raw.length)) {
    return { ok: false, error: 'format' };
  }
  const code = normalizeBarcode(raw);
  return isValidBarcode(code) ? { ok: true, code } : { ok: false, error: 'checkDigit' };
}
