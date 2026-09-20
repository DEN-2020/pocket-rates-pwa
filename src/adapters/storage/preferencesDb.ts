import { openPocketRatesDb, STORES } from './db';

export async function readPreference<T>(key: string): Promise<T | undefined> {
  const db = await openPocketRatesDb();

  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORES.preferences, 'readonly');
      const request = tx.objectStore(STORES.preferences).get(key);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error ?? new Error('Could not read preference.'));
    });
  } finally {
    db.close();
  }
}

export async function writePreference<T>(key: string, value: T): Promise<void> {
  const db = await openPocketRatesDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.preferences, 'readwrite');
      tx.objectStore(STORES.preferences).put(value, key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Could not save preference.'));
      tx.onabort = () => reject(tx.error ?? new Error('Could not save preference.'));
    });
  } finally {
    db.close();
  }
}
