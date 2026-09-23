import {
  isRedisConfigured,
  upstashGet,
  upstashMGet,
  upstashSet,
  upstashSetNX,
  upstashDel,
  upstashIncr,
} from './redis/upstashClient';
import {
  memoryGet,
  memoryMGet,
  memorySet,
  memorySetNX,
  memoryDel,
  memoryIncr,
} from './redis/memoryStore';
export { isRedisConfigured };
export async function redisGet<T>(key: string): Promise<T | null> {
  const upstash = await upstashGet<T>(key);
  if (upstash.success) {
    return upstash.data ?? null;
  }
  return memoryGet<T>(key);
}
export async function redisMGet<T>(keys: string[]): Promise<Record<string, T | null>> {
  if (!keys || keys.length === 0) return {};
  const upstash = await upstashMGet<T>(keys);
  if (upstash) {
    return upstash;
  }
  return memoryMGet<T>(keys);
}
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<boolean> {
  const upstashOk = await upstashSet(key, value, ttlSeconds);
  if (!upstashOk) {
    memorySet(key, value, ttlSeconds);
  } else {
    memorySet(key, value, ttlSeconds);
  }
  return true;
}
export async function redisDel(key: string | string[]): Promise<boolean> {
  const keys = Array.isArray(key) ? key : [key];
  if (keys.length === 0) return true;
  await upstashDel(keys);
  memoryDel(keys);
  return true;
}
export async function redisIncr(key: string, ttlSeconds?: number): Promise<number> {
  const upstashResult = await upstashIncr(key, ttlSeconds);
  if (typeof upstashResult === 'number') {
    return upstashResult;
  }
  return memoryIncr(key, ttlSeconds);
}
/**
 * Claims `key` for `ttlSeconds`, returning `true` only to the first caller.
 *
 * Used for the single-flight gates around upstream NAV work. Falls back to a
 * per-process gate when Redis is unreachable, which is weaker but never blocks
 * the work outright — a duplicated refresh is recoverable, a refresh that never
 * happens is not.
 */
export async function redisSetIfAbsent(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  const upstash = await upstashSetNX(key, value, ttlSeconds);
  if (upstash.reachable) return upstash.ok;
  return memorySetNX(key, value, ttlSeconds);
}
