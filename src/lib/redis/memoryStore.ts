interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const inMemoryStore = new Map<string, CacheEntry<unknown>>();
const MAX_MEMORY_ITEMS = 500;
export function pruneMemoryStore(): void {
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
export function memoryGet<T>(key: string): T | null {
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
export function memoryMGet<T>(keys: string[]): Record<string, T | null> {
  const result: Record<string, T | null> = {};
  for (const k of keys) {
    result[k] = memoryGet<T>(k);
  }
  return result;
}
export function memorySet(key: string, value: unknown, ttlSeconds = 3600): void {
  pruneMemoryStore();
  inMemoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
export function memoryDel(keys: string[]): void {
  for (const k of keys) {
    inMemoryStore.delete(k);
  }
}
export function memoryIncr(key: string, ttlSeconds?: number): number {
  const cached = inMemoryStore.get(key);
  const current = typeof cached?.value === 'number' ? cached.value : 0;
  const next = current + 1;
  inMemoryStore.set(key, {
    value: next,
    expiresAt: Date.now() + (ttlSeconds ?? 3600) * 1000,
  });
  return next;
}
