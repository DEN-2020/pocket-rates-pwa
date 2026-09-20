import { describe, expect, it } from 'vitest';
import { convertAmount, MissingRateError } from '../../src/domain/conversion/convert';
import type { QuoteSnapshot } from '../../src/domain/conversion/types';

const snapshot: QuoteSnapshot = {
  reference: 'USD',
  rates: { EUR: '0.84', EGP: '48.6', RUB: '83.5' },
  source: 'test',
  quoteType: 'reference',
  sourceDate: '2026-09-20',
  fetchedAt: '2026-09-20T12:00:00.000Z'
};

describe('convertAmount', () => {
  it('converts from the reference asset', () => {
    expect(convertAmount('100', 'USD', 'EGP', snapshot).toString()).toBe('4860');
  });

  it('converts cross-rates without display rounding', () => {
    expect(convertAmount('100', 'EUR', 'EGP', snapshot).toSignificantDigits(16).toString())
      .toBe('5785.714285714286');
  });

  it('keeps same-asset values unchanged', () => {
    expect(convertAmount('123.4500', 'EUR', 'EUR', snapshot).toString()).toBe('123.45');
  });

  it('throws for a missing rate', () => {
    expect(() => convertAmount('1', 'GBP', 'EUR', snapshot)).toThrow(MissingRateError);
  });
});
