import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface ApiCache extends DBSchema {
  data: {
    key: string;
    value: {
      data: any[];
      timestamp: number;
      endpoint: string;
    };
    indexes: { 'by-endpoint': string };
  };
}

const DB_NAME = 'pwa-cache';
const DB_VERSION = 1;
const STORE_NAME = 'data';

export const initDB = async () => {
  return await openDB<ApiCache>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<ApiCache>) {
      const store = db.createObjectStore(STORE_NAME);
      store.createIndex('by-endpoint', 'endpoint');
    }
  });
};

export const saveToCache = async (endpoint: string, data: any[]) => {
  const db = await initDB();
  const timestamp = Date.now();
  const key = `${endpoint}-${timestamp}`;

  await db.put(STORE_NAME, {
    data,
    timestamp,
    endpoint
  }, key);

  localStorage.setItem(`latest-${endpoint}`, key);

  return data;
};

export const getLatestFromCache = async (endpoint: string) => {
  const db = await initDB();
  const latestKey = localStorage.getItem(`latest-${endpoint}`);

  if (!latestKey) return null;

  const data = await db.get(STORE_NAME, latestKey);
  return data ? data.data : null;
};

export const fetchWithOfflineSupport = async (apiUrl: string) => {
  const endpoint = apiUrl.split('/').pop() || '';
  let data = null;
  let networkError = null;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    const json = await response.json();
    data = Array.isArray(json) ? json : json?.data || [json];

    await saveToCache(endpoint, data);

    localStorage.setItem(`last-updated-${endpoint}`, Date.now().toString());

    return { data, fromCache: false, timestamp: Date.now() };
  } catch (error) {
    networkError = error;
  }

  try {
    const cachedData = await getLatestFromCache(endpoint);
    if (cachedData) {
      const timestamp = parseInt(localStorage.getItem(`last-updated-${endpoint}`) || '0');
      return {
        data: cachedData,
        fromCache: true,
        timestamp,
        error: networkError
      };
    }
  } catch (cacheError) { }

  throw networkError;
};


export const clearCache = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('latest-') || key.startsWith('last-updated-')) {
      localStorage.removeItem(key);
    }
  });
};
