import { describe, expect, it } from 'vitest';
import { mergeQuoteSnapshots } from '../../src/domain/conversion/mergeSnapshots';
import type { QuoteSnapshot } from '../../src/domain/conversion/types';

const fiat: QuoteSnapshot = {
  reference: 'USD',
  rates: { EUR: '0.84', EGP: '48.6' },
  source: 'frankfurter',
  quoteType: 'blended',
  sourceDate: '2026-09-20',
  fetchedAt: '2026-09-20T12:00:00.000Z'
};

const crypto: QuoteSnapshot = {
  reference: 'USD',
  rates: { BTC: '0.00002' },
  source: 'coingecko-keyless',
  quoteType: 'market',
  sourceDate: '2026-09-20T12:01:00.000Z',
  fetchedAt: '2026-09-20T12:01:05.000Z'
};

describe('mergeQuoteSnapshots', () => {
  it('merges rates sharing the same reference', () => {
    const merged = mergeQuoteSnapshots('USD', [fiat, crypto]);

    expect(merged.rates).toEqual({
      EUR: '0.84',
      EGP: '48.6',
      BTC: '0.00002'
    });
    expect(merged.quoteType).toBe('mixed');
    expect(merged.source).toContain('frankfurter');
    expect(merged.source).toContain('coingecko-keyless');
  });
});
