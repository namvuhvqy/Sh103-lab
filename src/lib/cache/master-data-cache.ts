/**
 * Lightweight in-memory TTL + Single-Flight deduplication cache for static master data
 * (5 lab areas/locations, 20 lab equipment assets, published form template versions)
 * and short-lived concurrent query coalescing across parallel Server Components.
 *
 * Strictly NEVER caches mutable clinical records, measurements, or auth state.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inflightStore = new Map<string, Promise<unknown>>();

export const MASTER_DATA_TTL_MS = 5 * 60 * 1000; // 5 minutes for static master data
export const COALESCE_TTL_MS = 1500; // 1.5s coalescing window for parallel queries in the same navigation burst

export async function getOrFetchCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const inflight = inflightStore.get(key) as Promise<T> | undefined;
  if (inflight) {
    return inflight;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      if (ttlMs > 0) {
        cacheStore.set(key, {
          value: result,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return result;
    } finally {
      inflightStore.delete(key);
    }
  })();

  inflightStore.set(key, promise);
  return promise;
}

export function invalidateMasterDataCache(prefix?: string): void {
  if (!prefix) {
    cacheStore.clear();
    inflightStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
  for (const key of inflightStore.keys()) {
    if (key.startsWith(prefix)) {
      inflightStore.delete(key);
    }
  }
}

