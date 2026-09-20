import { describe, expect, it } from 'vitest';
import { formatAssetAmount } from '../../src/domain/assets/format';
import type { Asset } from '../../src/domain/assets/types';

const eur: Asset = {
  id: 'fiat:eur',
  kind: 'fiat',
  code: 'EUR',
  name: 'Euro',
  displayPrecision: 2
};

const jpy: Asset = {
  id: 'fiat:jpy',
  kind: 'fiat',
  code: 'JPY',
  name: 'Japanese Yen',
  displayPrecision: 0
};

describe('formatAssetAmount', () => {
  it('uses grouping and configured fiat precision', () => {
    expect(formatAssetAmount('1234.567', eur, 'en-US')).toBe('1,234.57');
  });

  it('supports zero-decimal display currencies', () => {
    expect(formatAssetAmount('1234.9', jpy, 'en-US')).toBe('1,235');
  });

  it('does not leak invalid numeric text into the UI', () => {
    expect(formatAssetAmount('not-a-number', eur, 'en-US')).toBe('—');
  });
});
