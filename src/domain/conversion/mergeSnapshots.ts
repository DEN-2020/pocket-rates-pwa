import type { QuoteSnapshot } from './types';

export function mergeQuoteSnapshots(
  reference: string,
  snapshots: readonly QuoteSnapshot[]
): QuoteSnapshot {
  const normalizedReference = reference.toUpperCase();
  const relevant = snapshots.filter(
    (snapshot) => snapshot.reference.toUpperCase() === normalizedReference
  );

  const rates: Record<string, string> = {};
  let sourceDate = '';
  let fetchedAt = '';
  const sources = new Set<string>();

  for (const snapshot of relevant) {
    Object.assign(rates, snapshot.rates);
    sources.add(snapshot.source);

    if (snapshot.sourceDate > sourceDate) sourceDate = snapshot.sourceDate;
    if (snapshot.fetchedAt > fetchedAt) fetchedAt = snapshot.fetchedAt;
  }

  return {
    reference: normalizedReference,
    rates,
    source: [...sources].join(' + '),
    quoteType: relevant.length > 1 ? 'mixed' : relevant[0]?.quoteType ?? 'reference',
    sourceDate,
    fetchedAt: fetchedAt || new Date().toISOString()
  };
}
