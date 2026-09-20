import { describe, expect, it } from 'vitest';
import { resolveHistoryPeriod } from '../../src/domain/history/periods';

const now = new Date('2026-09-20T18:00:00.000Z');

describe('resolveHistoryPeriod', () => {
  it('uses daily data for short periods', () => {
    expect(resolveHistoryPeriod('7d', now)).toEqual({
      from: '2026-09-13',
      to: '2026-09-20',
      grouping: 'day'
    });
  });

  it('downsamples five-year history monthly', () => {
    expect(resolveHistoryPeriod('5y', now)).toEqual({
      from: '2021-09-20',
      to: '2026-09-20',
      grouping: 'month'
    });
  });

  it('requests broad monthly coverage for MAX', () => {
    expect(resolveHistoryPeriod('max', now)).toEqual({
      from: '1948-01-01',
      to: '2026-09-20',
      grouping: 'month'
    });
  });
});
