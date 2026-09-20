import type { QuoteSnapshot } from '../../domain/conversion/types';
import type { HistoricalSeries, HistoryRequest } from '../../domain/history/types';
import type { FiatRateProvider } from './types';
import { ProviderError } from './types';

interface FrankfurterRow {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export class FrankfurterProvider implements FiatRateProvider {
  readonly id = 'frankfurter';
  private readonly endpoint = 'https://api.frankfurter.dev/v2/rates';

  async getLatest(base: string, quotes: readonly string[], signal?: AbortSignal): Promise<QuoteSnapshot> {
    const wanted = [...new Set(quotes.filter((code) => code !== base))];

    const url = new URL(this.endpoint);
    url.searchParams.set('base', base.toLowerCase());
    url.searchParams.set('quotes', wanted.map((code) => code.toLowerCase()).join(','));

    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });

    if (!response.ok) {
      throw new ProviderError(`Frankfurter HTTP ${response.status}`, this.id, response.status);
    }

    const rows = (await response.json()) as FrankfurterRow[];
    const rates: Record<string, string> = {};
    let sourceDate = '';

    for (const row of rows) {
      rates[row.quote.toUpperCase()] = String(row.rate);
      if (row.date > sourceDate) sourceDate = row.date;
    }

    return {
      reference: base.toUpperCase(),
      rates,
      source: this.id,
      quoteType: 'blended',
      sourceDate,
      fetchedAt: new Date().toISOString()
    };
  }

  async getHistory(request: HistoryRequest, signal?: AbortSignal): Promise<HistoricalSeries> {
    const url = new URL(this.endpoint);
    url.searchParams.set('base', request.base.toLowerCase());
    url.searchParams.set('quotes', request.quote.toLowerCase());
    url.searchParams.set('from', request.from);
    url.searchParams.set('to', request.to);

    if (request.grouping === 'week' || request.grouping === 'month') {
      url.searchParams.set('group', request.grouping);
    }

    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });

    if (!response.ok) {
      throw new ProviderError(`Frankfurter history HTTP ${response.status}`, this.id, response.status);
    }

    const rows = (await response.json()) as FrankfurterRow[];
    const expectedQuote = request.quote.toUpperCase();

    const points = rows
      .filter((row) => row.quote.toUpperCase() === expectedQuote)
      .map((row) => ({
        date: row.date,
        value: String(row.rate)
      }))
      .sort((left, right) => left.date.localeCompare(right.date));

    return {
      base: request.base.toUpperCase(),
      quote: expectedQuote,
      source: this.id,
      quoteType: 'blended',
      grouping: request.grouping ?? 'day',
      requestedFrom: request.from,
      requestedTo: request.to,
      actualFrom: points[0]?.date ?? null,
      actualTo: points.at(-1)?.date ?? null,
      points
    };
  }
}
