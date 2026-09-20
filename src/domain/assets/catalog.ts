import type { Asset } from './types';

export const initialAssets: readonly Asset[] = [
  { id: 'fiat:eur', kind: 'fiat', code: 'EUR', name: 'Euro', flag: '🇪🇺', displayPrecision: 2 },
  { id: 'fiat:usd', kind: 'fiat', code: 'USD', name: 'US Dollar', flag: '🇺🇸', displayPrecision: 2 },
  { id: 'fiat:egp', kind: 'fiat', code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬', displayPrecision: 2 },
  { id: 'fiat:rub', kind: 'fiat', code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺', displayPrecision: 2 },
  { id: 'fiat:try', kind: 'fiat', code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', displayPrecision: 2 },
  { id: 'fiat:cny', kind: 'fiat', code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', displayPrecision: 2 }
] as const;
