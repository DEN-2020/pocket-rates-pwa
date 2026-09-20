import Decimal from 'decimal.js-light';
import type { QuoteSnapshot } from './types';

export class MissingRateError extends Error {
  constructor(code: string) {
    super(`Missing rate for ${code}`);
    this.name = 'MissingRateError';
  }
}

function unitsPerReference(code: string, snapshot: QuoteSnapshot): Decimal {
  if (code === snapshot.reference) return new Decimal(1);

  const rate = snapshot.rates[code];
  if (!rate) throw new MissingRateError(code);

  return new Decimal(rate);
}

export function convertAmount(
  amount: string,
  from: string,
  to: string,
  snapshot: QuoteSnapshot
): Decimal {
  const input = new Decimal(amount);
  if (from === to) return input;

  const fromRate = unitsPerReference(from, snapshot);
  const toRate = unitsPerReference(to, snapshot);

  return input.mul(toRate).div(fromRate);
}
