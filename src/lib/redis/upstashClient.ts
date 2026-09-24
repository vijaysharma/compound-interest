import { getUpstashConfig, parseRedisJson } from './upstashConfig';
export { getUpstashConfig, isRedisConfigured } from './upstashConfig';
export async function upstashGet<T>(key: string): Promise<{ success: boolean; data?: T | null }> {
  const cfg = getUpstashConfig();
  if (!cfg) return { success: false };
  try {
    const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { result?: string | null };
      if (json.result !== null && json.result !== undefined) {
        return { success: true, data: parseRedisJson<T>(json.result) };
      }
      return { success: true, data: null };
    }
  } catch (err) {
    console.warn(`[Redis] GET failed for key "${key}":`, err);
  }
  return { success: false };
}
export async function upstashMGet<T>(keys: string[]): Promise<Record<string, T | null> | null> {
  const cfg = getUpstashConfig();
  if (!cfg || keys.length === 0) return null;
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(keys.map((k) => ['get', k])),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const result: Record<string, T | null> = {};
      const jsonList = (await res.json()) as Array<{ result?: string | null }>;
      for (let i = 0; i < keys.length; i++) {
        result[keys[i]] = parseRedisJson<T>(jsonList[i]?.result);
      }
      return result;
    }
  } catch (err) {
    console.warn('[Redis] MGET failed:', err);
  }
  return null;
}
export async function upstashSet(key: string, value: unknown, ttlSeconds = 3600): Promise<boolean> {
  const cfg = getUpstashConfig();
  if (!cfg) return false;
  try {
    const endpoint = ttlSeconds > 0
      ? `${cfg.url}/set/${encodeURIComponent(key)}?ex=${ttlSeconds}`
      : `${cfg.url}/set/${encodeURIComponent(key)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[Redis] SET failed for key "${key}":`, err);
    return false;
  }
}
export async function upstashSetNX(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<{ ok: boolean; reachable: boolean }> {
  const cfg = getUpstashConfig();
  if (!cfg) return { ok: false, reachable: false };
  try {
    const res = await fetch(
      `${cfg.url}/set/${encodeURIComponent(key)}?nx=true&ex=${ttlSeconds}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const json = (await res.json()) as { result?: string | null };
      return { ok: json.result === 'OK', reachable: true };
    }
  } catch (err) {
    console.warn(`[Redis] SET NX failed for key "${key}":`, err);
  }
  return { ok: false, reachable: false };
}
export async function upstashDel(keys: string[]): Promise<boolean> {
  const cfg = getUpstashConfig();
  if (!cfg || keys.length === 0) return false;
  try {
    await fetch(`${cfg.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(keys.map((k) => ['del', k])),
      signal: AbortSignal.timeout(2000),
    });
    return true;
  } catch (err) {
    console.warn('[Redis] DEL failed:', err);
    return false;
  }
}
export async function upstashIncr(key: string, ttlSeconds?: number): Promise<number | null> {
  const cfg = getUpstashConfig();
  if (!cfg) return null;
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
  return null;
}
