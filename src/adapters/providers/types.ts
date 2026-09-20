import type { QuoteSnapshot } from '../../domain/conversion/types';

export interface FiatRateProvider {
  readonly id: string;
  getLatest(base: string, quotes: readonly string[], signal?: AbortSignal): Promise<QuoteSnapshot>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
