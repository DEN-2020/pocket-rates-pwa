import type { Asset } from './types';

export const assetCatalog: readonly Asset[] = [
  { id: 'fiat:eur', kind: 'fiat', code: 'EUR', name: 'Euro', flag: '🇪🇺', displayPrecision: 2 },
  { id: 'fiat:usd', kind: 'fiat', code: 'USD', name: 'US Dollar', flag: '🇺🇸', displayPrecision: 2 },
  { id: 'fiat:egp', kind: 'fiat', code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬', displayPrecision: 2 },
  { id: 'fiat:rub', kind: 'fiat', code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺', displayPrecision: 2 },
  { id: 'fiat:try', kind: 'fiat', code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', displayPrecision: 2 },
  { id: 'fiat:cny', kind: 'fiat', code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', displayPrecision: 2 },
  { id: 'fiat:gbp', kind: 'fiat', code: 'GBP', name: 'British Pound', flag: '🇬🇧', displayPrecision: 2 },
  { id: 'fiat:aed', kind: 'fiat', code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', displayPrecision: 2 },
  { id: 'fiat:sar', kind: 'fiat', code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', displayPrecision: 2 },
  { id: 'fiat:chf', kind: 'fiat', code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', displayPrecision: 2 },
  { id: 'fiat:jpy', kind: 'fiat', code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', displayPrecision: 0 },
  { id: 'fiat:sek', kind: 'fiat', code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪', displayPrecision: 2 },
  { id: 'fiat:nok', kind: 'fiat', code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴', displayPrecision: 2 },
  { id: 'fiat:dkk', kind: 'fiat', code: 'DKK', name: 'Danish Krone', flag: '🇩🇰', displayPrecision: 2 },
  { id: 'fiat:pln', kind: 'fiat', code: 'PLN', name: 'Polish Zloty', flag: '🇵🇱', displayPrecision: 2 },
  { id: 'fiat:cad', kind: 'fiat', code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', displayPrecision: 2 },
  { id: 'fiat:aud', kind: 'fiat', code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', displayPrecision: 2 }
] as const;

export const initialAssetIds = ['fiat:eur', 'fiat:usd', 'fiat:egp', 'fiat:rub', 'fiat:try', 'fiat:cny'] as const;

export function findAsset(id: string): Asset | undefined {
  return assetCatalog.find((asset) => asset.id === id);
}
