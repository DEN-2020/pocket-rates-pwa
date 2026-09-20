import Decimal from 'decimal.js-light';
import type { Asset } from './types';

export function formatAssetAmount(value: string, asset: Asset): string {
  let decimal: Decimal;
  try {
    decimal = new Decimal(value);
  } catch {
    return '—';
  }

  const absolute = decimal.abs();
  const maxFractionDigits =
    asset.kind === 'crypto'
      ? absolute.greaterThanOrEqualTo(1) ? Math.max(asset.displayPrecision, 4) : 8
      : asset.displayPrecision;

  const numeric = Number(decimal.toSignificantDigits(12).toString());
  if (!Number.isFinite(numeric)) return decimal.toString();

  return new Intl.NumberFormat(undefined, {
    useGrouping: true,
    maximumFractionDigits: maxFractionDigits
  }).format(numeric);
}
