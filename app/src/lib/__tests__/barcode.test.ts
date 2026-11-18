import {
  checkBarcodeEntry,
  expandUpcE,
  gtinCheckDigit,
  isValidBarcode,
  normalizeBarcode,
} from '@/lib/barcode';

describe('gtinCheckDigit', () => {
  it.each([
    ['544900000099', 6], // Coca-Cola 33 cl, EAN-13 5449000000996
    ['301762042200', 3], // Nutella, 3017620422003
    ['9638507', 4], // EAN-8 96385074
    ['03600029145', 2], // UPC-A 036000291452
  ])('%s → %d', (body, digit) => {
    expect(gtinCheckDigit(body)).toBe(digit);
  });
});

describe('isValidBarcode', () => {
  it.each(['5449000000996', '3017620422003', '96385074', '036000291452', '0036000291452'])(
    'accepts %s',
    (code) => {
      expect(isValidBarcode(code)).toBe(true);
    },
  );

  it.each([
    ['wrong check digit', '5449000000997'],
    ['too short', '1234567'],
    ['11 digits', '12345678901'],
    ['14 digits', '05449000000996'],
    ['letters', '54490000009a6'],
    ['empty', ''],
  ])('rejects %s', (_label, code) => {
    expect(isValidBarcode(code)).toBe(false);
  });
});

describe('expandUpcE', () => {
  it.each([
    ['04252614', '042100005264'], // last digit 0–2
    ['01234531', '012300000451'], // last digit 3
    ['01234640', '012340000060'], // last digit 4
    ['01234572', '012345000072'], // last digit 5–9
  ])('%s → %s', (upcE, upcA) => {
    expect(expandUpcE(upcE)).toBe(upcA);
    expect(isValidBarcode(upcA)).toBe(true);
  });

  it('rejects codes that are not UPC-E', () => {
    expect(expandUpcE('24252614')).toBeNull();
    expect(expandUpcE('0425261')).toBeNull();
  });
});

describe('normalizeBarcode', () => {
  it('keeps EAN-13 and EAN-8 as they are', () => {
    expect(normalizeBarcode('5449000000996', 'ean13')).toBe('5449000000996');
    expect(normalizeBarcode('96385074', 'ean8')).toBe('96385074');
    expect(normalizeBarcode('96385074')).toBe('96385074');
  });

  it('pads UPC-A to 13 digits (same as iOS reporting it as EAN-13)', () => {
    expect(normalizeBarcode('036000291452', 'upc_a')).toBe('0036000291452');
    expect(normalizeBarcode('0036000291452', 'ean13')).toBe('0036000291452');
  });

  it('expands UPC-E only when the scanner reports UPC-E', () => {
    expect(normalizeBarcode('04252614', 'upc_e')).toBe('0042100005264');
    expect(normalizeBarcode('04252614', 'org.gs1.UPC-E')).toBe('0042100005264');
    expect(normalizeBarcode('04252614', 'ean8')).toBe('04252614');
  });

  it('strips spaces and dashes', () => {
    expect(normalizeBarcode(' 5 449000-000996 ')).toBe('5449000000996');
  });
});

describe('checkBarcodeEntry', () => {
  it('returns the canonical code for a valid entry', () => {
    expect(checkBarcodeEntry('5449000000996')).toEqual({ ok: true, code: '5449000000996' });
    expect(checkBarcodeEntry('036000 291452')).toEqual({ ok: true, code: '0036000291452' });
  });

  it('flags a wrong length or non-digits as format', () => {
    expect(checkBarcodeEntry('')).toEqual({ ok: false, error: 'format' });
    expect(checkBarcodeEntry('12345')).toEqual({ ok: false, error: 'format' });
    expect(checkBarcodeEntry('54490000009a6')).toEqual({ ok: false, error: 'format' });
  });

  it('flags a mistyped digit as checkDigit', () => {
    expect(checkBarcodeEntry('5449000000997')).toEqual({ ok: false, error: 'checkDigit' });
  });
});
