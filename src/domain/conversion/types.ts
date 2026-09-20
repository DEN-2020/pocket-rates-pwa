export type QuoteType = 'reference' | 'blended' | 'bank' | 'market' | 'custom';

export interface QuoteSnapshot {
  reference: string;
  rates: Record<string, string>;
  source: string;
  quoteType: QuoteType;
  sourceDate: string;
  fetchedAt: string;
}
