/**
 * Simple TMDB API response cache with 5-minute TTL
 * Prevents duplicate requests for the same queries
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache = new Map<string, CacheEntry<any>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  
  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  
  return entry.data as T
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function clearCache(): void {
  cache.clear()
}

export function cacheSize(): number {
  return cache.size
}

/**
 * Wraps a fetch call with caching
 * @param key Cache key (usually: `${type}:${query}`)
 * @param fetcher Function that returns a promise
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached) return cached

  const data = await fetcher()
  setCached(key, data)
  return data
}
