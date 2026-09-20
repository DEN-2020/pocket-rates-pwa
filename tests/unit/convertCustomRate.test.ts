import { describe, expect, it } from 'vitest';
import { convertWithCustomRate } from '../../src/domain/customRates/convertCustomRate';

describe('convertWithCustomRate', () => {
  it('converts base to quote', () => {
    expect(convertWithCustomRate('100', 'base-to-quote', '52.5').toString()).toBe('5250');
  });

  it('converts quote to base', () => {
    expect(convertWithCustomRate('5250', 'quote-to-base', '52.5').toString()).toBe('100');
  });

  it('rejects non-positive rates', () => {
    expect(() => convertWithCustomRate('100', 'base-to-quote', '0')).toThrow();
    expect(() => convertWithCustomRate('100', 'base-to-quote', '-1')).toThrow();
  });
});
