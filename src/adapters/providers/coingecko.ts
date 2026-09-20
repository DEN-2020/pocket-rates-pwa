import Decimal from 'decimal.js-light';
import type { Asset } from '../../domain/assets/types';
import type { QuoteSnapshot } from '../../domain/conversion/types';
import { ProviderError } from './types';

interface CoinGeckoPriceRow {
  usd?: number;
  last_updated_at?: number;
}

type CoinGeckoPriceResponse = Record<string, CoinGeckoPriceRow>;

export class CoinGeckoKeylessProvider {
  readonly id = 'coingecko-keyless';
  private readonly endpoint = 'https://api.coingecko.com/api/v3/simple/price';

  async getLatest(assets: readonly Asset[], signal?: AbortSignal): Promise<QuoteSnapshot> {
    const cryptoAssets = assets.filter(
      (asset) => asset.kind === 'crypto' && asset.providerIds?.coingecko
    );

    if (cryptoAssets.length === 0) {
      return {
        reference: 'USD',
        rates: {},
        source: this.id,
        quoteType: 'market',
        sourceDate: '',
        fetchedAt: new Date().toISOString()
      };
    }

    const ids = cryptoAssets.map((asset) => asset.providerIds?.coingecko as string);
    const url = new URL(this.endpoint);
    url.searchParams.set('ids', ids.join(','));
    url.searchParams.set('vs_currencies', 'usd');
    url.searchParams.set('include_last_updated_at', 'true');

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal
    });

    if (!response.ok) {
      throw new ProviderError(`CoinGecko HTTP ${response.status}`, this.id, response.status);
    }

    const payload = (await response.json()) as CoinGeckoPriceResponse;
    const rates: Record<string, string> = {};
    let latestTimestamp = 0;

    for (const asset of cryptoAssets) {
      const providerId = asset.providerIds?.coingecko;
      if (!providerId) continue;

      const row = payload[providerId];
      if (!row?.usd || row.usd <= 0) continue;

      rates[asset.code] = new Decimal(1).div(row.usd).toSignificantDigits(18).toString();

      if (row.last_updated_at && row.last_updated_at > latestTimestamp) {
        latestTimestamp = row.last_updated_at;
      }
    }

    return {
      reference: 'USD',
      rates,
      source: this.id,
      quoteType: 'market',
      sourceDate: latestTimestamp
        ? new Date(latestTimestamp * 1000).toISOString()
        : '',
      fetchedAt: new Date().toISOString()
    };
  }
}
