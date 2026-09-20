export type AssetKind = 'fiat' | 'crypto';

export interface AssetProviderIds {
  coingecko?: string;
}

export interface Asset {
  id: string;
  kind: AssetKind;
  code: string;
  name: string;
  flag?: string;
  displayPrecision: number;
  providerIds?: AssetProviderIds;
}
