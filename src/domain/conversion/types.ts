export type QuoteType = 'reference' | 'blended' | 'bank' | 'market' | 'custom' | 'mixed';

export interface QuoteSnapshot {
  reference: string;
  rates: Record<string, string>;
  source: string;
  quoteType: QuoteType;
  sourceDate: string;
  fetchedAt: string;
}
