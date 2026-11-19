import { nextScanReset, pluralRo, remainingScansText, scanLimitText } from '@/lib/scanLimit';

const forms = { one: 'scanare', few: 'scanări', other: 'de scanări' };

describe('pluralRo', () => {
  it.each([
    [0, 'scanări'],
    [1, 'scanare'],
    [2, 'scanări'],
    [10, 'scanări'],
    [19, 'scanări'],
    [20, 'de scanări'],
    [100, 'de scanări'],
    [101, 'scanări'],
    [119, 'scanări'],
    [120, 'de scanări'],
  ])('%i → %s', (n, expected) => {
    expect(pluralRo(n, forms)).toBe(expected);
  });
});

describe('remainingScansText', () => {
  it('agrees with the count for 0–10', () => {
    expect(remainingScansText(10)).toBe('10 scanări rămase luna aceasta');
    expect(remainingScansText(7)).toBe('7 scanări rămase luna aceasta');
    expect(remainingScansText(2)).toBe('2 scanări rămase luna aceasta');
    expect(remainingScansText(1)).toBe('1 scanare rămasă luna aceasta');
    expect(remainingScansText(0)).toBe('0 scanări rămase luna aceasta');
  });

  it('uses "de" from 20 up', () => {
    expect(remainingScansText(20)).toBe('20 de scanări rămase luna aceasta');
  });
});

describe('nextScanReset', () => {
  it('is the first day of the next month', () => {
    expect(nextScanReset(new Date(2026, 10, 19))).toEqual(new Date(2026, 11, 1));
    expect(nextScanReset(new Date(2026, 11, 31, 23, 59))).toEqual(new Date(2027, 0, 1));
  });
});

describe('scanLimitText', () => {
  it('names the limit and when scans come back', () => {
    expect(scanLimitText(10, new Date(2026, 10, 19))).toBe(
      'Ai folosit cele 10 scanări din luna aceasta. Poți căuta manual oricând; scanările revin pe 1 decembrie.',
    );
  });
});
