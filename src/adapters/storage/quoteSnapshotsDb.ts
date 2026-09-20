import type { QuoteSnapshot } from '../../domain/conversion/types';
import { openPocketRatesDb, STORES } from './db';

interface CachedQuoteSnapshot {
  snapshot: QuoteSnapshot;
  cachedAt: string;
}

export async function readQuoteSnapshot(key: string): Promise<QuoteSnapshot | undefined> {
  const db = await openPocketRatesDb();

  try {
    return await new Promise<QuoteSnapshot | undefined>((resolve, reject) => {
      const tx = db.transaction(STORES.quoteSnapshots, 'readonly');
      const request = tx.objectStore(STORES.quoteSnapshots).get(key);

      request.onsuccess = () => {
        const cached = request.result as CachedQuoteSnapshot | undefined;
        resolve(cached?.snapshot);
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read cached rates.'));
    });
  } finally {
    db.close();
  }
}

export async function writeQuoteSnapshot(key: string, snapshot: QuoteSnapshot): Promise<void> {
  const db = await openPocketRatesDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.quoteSnapshots, 'readwrite');
      tx.objectStore(STORES.quoteSnapshots).put(
        {
          snapshot,
          cachedAt: new Date().toISOString()
        } satisfies CachedQuoteSnapshot,
        key
      );

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not cache rates.'));
      tx.onabort = () => reject(tx.error ?? new Error('Caching rates was aborted.'));
    });
  } finally {
    db.close();
  }
}
