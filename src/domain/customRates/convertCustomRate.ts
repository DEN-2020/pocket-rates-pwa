import Decimal from 'decimal.js-light';

export function convertWithCustomRate(
  amount: string,
  direction: 'base-to-quote' | 'quote-to-base',
  rate: string
): Decimal {
  const input = new Decimal(amount);
  const customRate = new Decimal(rate);

  if (customRate.lte(0)) {
    throw new Error('Custom rate must be greater than zero.');
  }

  return direction === 'base-to-quote'
    ? input.mul(customRate)
    : input.div(customRate);
}
