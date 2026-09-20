import type { QuoteType } from '../conversion/types';

export type HistoryGrouping = 'day' | 'week' | 'month';

export interface HistoricalPoint {
  date: string;
  value: string;
}

export interface HistoricalSeries {
  base: string;
  quote: string;
  source: string;
  quoteType: QuoteType;
  grouping: HistoryGrouping;
  requestedFrom: string;
  requestedTo: string;
  actualFrom: string | null;
  actualTo: string | null;
  points: HistoricalPoint[];
}

export interface HistoryRequest {
  base: string;
  quote: string;
  from: string;
  to: string;
  grouping?: HistoryGrouping;
}
