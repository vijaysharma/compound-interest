/**
 * High-performance Redis caching layer with seamless fallback to high-speed in-memory LRU.
 *
 * Supports:
 * 1. Upstash Redis REST API (via UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
 *    - Perfect for Vercel/Serverless: zero TCP connection exhaustion, edge-compatible.
 * 2. Self-hosted / Managed Redis HTTP proxy or REST gateways.
 * 3. High-speed In-Memory LRU with TTL (active when Redis env vars are not set).
 *
 * Safe: Never throws or interrupts critical user journeys if cache fails.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const inMemoryStore = new Map<string, CacheEntry<unknown>>();
const MAX_MEMORY_ITEMS = 500;
function pruneMemoryStore() {
  const now = Date.now();
  for (const [k, v] of inMemoryStore.entries()) {
    if (v.expiresAt <= now) {
      inMemoryStore.delete(k);
    }
  }
  if (inMemoryStore.size > MAX_MEMORY_ITEMS) {
    const keysToDelete = Array.from(inMemoryStore.keys()).slice(0, 100);
    for (const k of keysToDelete) {
      inMemoryStore.delete(k);
    }
  }
}
function getUpstashConfig() {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (rawUrl && rawToken) {
    const url = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
    const token = rawToken.trim().replace(/^["']|["']$/g, '');
    if (url && token) {
      return { url, token };
    }
  }
  return null;
}
export function isRedisConfigured(): boolean {
  return Boolean(getUpstashConfig());
}
/**
 * Retrieve a JSON-parsed value by key.
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const cfg = getUpstashConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${cfg.token}`,
        },
        signal: AbortSignal.timeout(4000),
        cache: 'no-store',
      });
      if (res.ok) {
        const json = (await res.json()) as { result?: string | null };
        if (json.result !== null && json.result !== undefined) {
          try {
            let parsed = JSON.parse(json.result);
            if (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
              } catch {
                // Keep as string if it wasn't JSON
              }
            }
            return parsed as T;
          } catch {
            return json.result as unknown as T;
          }
        }
        return null;
      }
    } catch (err) {
      console.warn(`[Redis] GET failed for key "${key}", falling back to memory store:`, err);
    }
  }
  // Memory fallback
  const cached = inMemoryStore.get(key);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      let val = cached.value;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          // Ignore non-JSON string
        }
      }
      return val as T;
    }
    inMemoryStore.delete(key);
  }
  return null;
}
/**
 * Retrieve multiple JSON-parsed values by keys in a single pipeline round-trip.
 */
export async function redisMGet<T>(keys: string[]): Promise<Record<string, T | null>> {
  const result: Record<string, T | null> = {};
  if (!keys || keys.length === 0) return result;
  const cfg = getUpstashConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keys.map((k) => ['get', k])),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const jsonList = (await res.json()) as Array<{ result?: string | null }>;
        for (let i = 0; i < keys.length; i++) {
          const raw = jsonList[i]?.result;
          if (raw !== null && raw !== undefined) {
            try {
              let parsed = JSON.parse(raw);
              if (typeof parsed === 'string') {
                try {
                  parsed = JSON.parse(parsed);
                } catch {
                  // Keep as string if it wasn't double-serialized JSON
                }
              }
              result[keys[i]] = parsed as T;
            } catch {
              result[keys[i]] = raw as unknown as T;
            }
          } else {
            result[keys[i]] = null;
          }
        }
        return result;
      }
    } catch (err) {
      console.warn('[Redis] MGET failed, falling back to memory store:', err);
    }
  }
  // Fallback to inMemoryStore
  for (const k of keys) {
    const cached = inMemoryStore.get(k);
    if (cached && cached.expiresAt > Date.now()) {
      let val = cached.value;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          // Keep string if not valid JSON
        }
      }
      result[k] = val as T;
    } else {
      result[k] = null;
    }
  }
  return result;
}
/**
 * Store a JSON-serializable value in cache with optional TTL in seconds.
 */
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<boolean> {
  const cfg = getUpstashConfig();
  if (cfg) {
    try {
      const endpoint = ttlSeconds > 0
        ? `${cfg.url}/set/${encodeURIComponent(key)}?ex=${ttlSeconds}`
        : `${cfg.url}/set/${encodeURIComponent(key)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.warn(`[Redis] SET failed for key "${key}", writing to memory store:`, err);
    }
  }
  // Memory fallback
  pruneMemoryStore();
  inMemoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}
/**
 * Delete one or more keys from cache.
 */
export async function redisDel(key: string | string[]): Promise<boolean> {
  const keys = Array.isArray(key) ? key : [key];
  if (keys.length === 0) return true;
  const cfg = getUpstashConfig();
  if (cfg) {
    try {
      await fetch(`${cfg.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keys.map((k) => ['del', k])),
        signal: AbortSignal.timeout(2000),
      });
    } catch (err) {
      console.warn('[Redis] DEL failed:', err);
    }
  }
  for (const k of keys) {
    inMemoryStore.delete(k);
  }
  return true;
}
/**
 * Atomic increment with optional TTL.
 */
export async function redisIncr(key: string, ttlSeconds?: number): Promise<number> {
  const cfg = getUpstashConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/incr/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}` },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const json = (await res.json()) as { result: number };
        if (typeof json.result === 'number') {
          if (ttlSeconds && json.result === 1) {
            fetch(`${cfg.url}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${cfg.token}` },
            }).catch(() => {});
          }
          return json.result;
        }
      }
    } catch (err) {
      console.warn(`[Redis] INCR failed for key "${key}":`, err);
    }
  }
  // Memory fallback
  const cached = inMemoryStore.get(key);
  const current = typeof cached?.value === 'number' ? cached.value : 0;
  const next = current + 1;
  inMemoryStore.set(key, {
    value: next,
    expiresAt: Date.now() + (ttlSeconds ?? 3600) * 1000,
  });
  return next;
}
