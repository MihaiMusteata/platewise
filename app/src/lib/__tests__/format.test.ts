import { formatDecimal, formatNumber, parseDecimal } from '@/lib/format';

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1.000'],
    [2000, '2.000'],
    [1234567, '1.234.567'],
    [1849.6, '1.850'],
    [-1250, '-1.250'],
  ])('%p → %p', (input, expected) => {
    expect(formatNumber(input)).toBe(expected);
  });
});

describe('formatDecimal', () => {
  it('uses a comma for decimals', () => {
    expect(formatDecimal(72.4)).toBe('72,4');
    expect(formatDecimal(3.44)).toBe('3,4');
  });
  it('groups thousands with dots', () => {
    expect(formatDecimal(1234.5)).toBe('1.234,5');
  });
  it('respects digits', () => {
    expect(formatDecimal(2, 2)).toBe('2,00');
    expect(formatDecimal(2.5, 0)).toBe('3');
  });
  it('can trim a zero fraction', () => {
    expect(formatDecimal(3, 1, true)).toBe('3');
    expect(formatDecimal(3.04, 1, true)).toBe('3');
    expect(formatDecimal(3.4, 1, true)).toBe('3,4');
  });
  it('handles negatives and negative zero', () => {
    expect(formatDecimal(-0.4)).toBe('-0,4');
    expect(formatDecimal(-0.04)).toBe('0,0');
  });
});

describe('parseDecimal', () => {
  it('accepts comma and dot', () => {
    expect(parseDecimal('72,4')).toBe(72.4);
    expect(parseDecimal(' 72.4 ')).toBe(72.4);
    expect(parseDecimal('80')).toBe(80);
  });
  it('rejects invalid input', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('-3')).toBeNaN();
    expect(parseDecimal('1,2,3')).toBeNaN();
  });
});
