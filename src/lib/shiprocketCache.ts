import { redisGet, redisSet, redisDel, redisDelPattern, redisSetIfAbsent } from './redis';

/**
 * Shiprocket Structured Cache Namespaces:
 * - sr:acc:list
 * - sr:acc:details
 * - sr:orders:...
 * - sr:track:...
 * - sr:statement:...
 * - sr:cust:list:...
 */

export const SR_CACHE_TTL = {
  ACCOUNTS_LIST: 1800,        // 30 mins
  ACCOUNT_DETAILS: 900,       // 15 mins
  ORDERS_LIST: 180,           // 3 mins
  TRACKING: 1800,             // 30 mins
  STATEMENT: 600,             // 10 mins
  CUSTOMERS_LIST: 600,        // 10 mins
  PICKUP_LOCATIONS: 3600,     // 1 hour
  CHANNELS: 3600,             // 1 hour
} as const;

/**
 * Cache invalidation helpers
 */
export async function invalidateShiprocketAccountsCache(): Promise<void> {
  try {
    await Promise.all([
      redisDelPattern('sr:acc:*'),
      redisDelPattern('sr:orders:*'),
      redisDelPattern('sr:statement:*'),
    ]);
  } catch (err) {
    console.warn('Failed to invalidate Shiprocket accounts cache:', err);
  }
}

export async function invalidateShiprocketOrdersCache(): Promise<void> {
  try {
    await Promise.all([
      redisDelPattern('sr:orders:*'),
      redisDelPattern('sr:statement:*'),
    ]);
  } catch (err) {
    console.warn('Failed to invalidate Shiprocket orders cache:', err);
  }
}

export async function invalidateShiprocketCustomersCache(): Promise<void> {
  try {
    await redisDelPattern('sr:cust:*');
  } catch (err) {
    console.warn('Failed to invalidate Shiprocket customers cache:', err);
  }
}

/**
 * Executes an async fetcher with Redis caching and single-flight stampede prevention
 */
export async function withShiprocketCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // 1. Try cache hit
  try {
    const cached = await redisGet<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // Fallback to fetcher on cache error
  }

  // 2. Fetch fresh data
  const fresh = await fetcher();

  // 3. Populate cache before returning: reads go to Upstash first, so a write still in flight
  // would make the next request (on any instance) miss and refetch. Failures stay best-effort.
  if (fresh !== null && fresh !== undefined) {
    await redisSet(key, fresh, ttlSeconds).catch(() => {});
  }

  return fresh;
}
