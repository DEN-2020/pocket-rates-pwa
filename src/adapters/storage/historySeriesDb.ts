import type { HistoricalSeries } from '../../domain/history/types';
import { openPocketRatesDb, STORES } from './db';

interface CachedHistoricalSeries {
  series: HistoricalSeries;
  cachedAt: string;
}

export async function readHistoricalSeries(key: string): Promise<HistoricalSeries | undefined> {
  const db = await openPocketRatesDb();

  try {
    return await new Promise<HistoricalSeries | undefined>((resolve, reject) => {
      const tx = db.transaction(STORES.historySeries, 'readonly');
      const request = tx.objectStore(STORES.historySeries).get(key);

      request.onsuccess = () => {
        const cached = request.result as CachedHistoricalSeries | undefined;
        resolve(cached?.series);
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read chart cache.'));
    });
  } finally {
    db.close();
  }
}

export async function writeHistoricalSeries(key: string, series: HistoricalSeries): Promise<void> {
  const db = await openPocketRatesDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.historySeries, 'readwrite');

      tx.objectStore(STORES.historySeries).put(
        {
          series,
          cachedAt: new Date().toISOString()
        } satisfies CachedHistoricalSeries,
        key
      );

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not cache chart history.'));
      tx.onabort = () => reject(tx.error ?? new Error('Caching chart history was aborted.'));
    });
  } finally {
    db.close();
  }
}
