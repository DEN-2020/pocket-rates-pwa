const DB_NAME = 'pocket-rates';
const DB_VERSION = 2;

export const STORES = {
  preferences: 'preferences',
  quoteSnapshots: 'quote-snapshots'
} as const;

export function openPocketRatesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB is unavailable.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORES.preferences)) {
        database.createObjectStore(STORES.preferences);
      }

      if (!database.objectStoreNames.contains(STORES.quoteSnapshots)) {
        database.createObjectStore(STORES.quoteSnapshots);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB.'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another open tab.'));
  });
}
