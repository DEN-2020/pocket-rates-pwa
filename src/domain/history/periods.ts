import type { HistoryGrouping } from './types';

export type HistoryPeriod = '7d' | '1m' | '3m' | '6m' | '1y' | '2y' | '5y' | '10y';

export const historyPeriods: readonly HistoryPeriod[] = [
  '7d', '1m', '3m', '6m', '1y', '2y', '5y', '10y'
];

export interface ResolvedHistoryPeriod {
  from: string;
  to: string;
  grouping: HistoryGrouping;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function resolveHistoryPeriod(period: HistoryPeriod, now = new Date()): ResolvedHistoryPeriod {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);

  switch (period) {
    case '7d':
      from.setUTCDate(from.getUTCDate() - 7);
      return { from: isoDate(from), to: isoDate(to), grouping: 'day' };
    case '1m':
      from.setUTCMonth(from.getUTCMonth() - 1);
      return { from: isoDate(from), to: isoDate(to), grouping: 'day' };
    case '3m':
      from.setUTCMonth(from.getUTCMonth() - 3);
      return { from: isoDate(from), to: isoDate(to), grouping: 'day' };
    case '6m':
      from.setUTCMonth(from.getUTCMonth() - 6);
      return { from: isoDate(from), to: isoDate(to), grouping: 'day' };
    case '1y':
      from.setUTCFullYear(from.getUTCFullYear() - 1);
      return { from: isoDate(from), to: isoDate(to), grouping: 'day' };
    case '2y':
      from.setUTCFullYear(from.getUTCFullYear() - 2);
      return { from: isoDate(from), to: isoDate(to), grouping: 'week' };
    case '5y':
      from.setUTCFullYear(from.getUTCFullYear() - 5);
      return { from: isoDate(from), to: isoDate(to), grouping: 'month' };
    case '10y':
      from.setUTCFullYear(from.getUTCFullYear() - 10);
      return { from: isoDate(from), to: isoDate(to), grouping: 'month' };
  }
}
