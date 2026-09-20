export function getUpstashConfig() {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!rawUrl || !rawToken) return null;
  const url = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
  const token = rawToken.trim().replace(/^["']|["']$/g, '');
  return url && token ? { url, token } : null;
}
export function isRedisConfigured(): boolean {
  return Boolean(getUpstashConfig());
}
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
        try {
          let parsed = JSON.parse(json.result);
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch { /* ignore */ }
          }
          return { success: true, data: parsed as T };
        } catch {
          return { success: true, data: json.result as unknown as T };
        }
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
        const raw = jsonList[i]?.result;
        if (raw !== null && raw !== undefined) {
          try {
            let parsed = JSON.parse(raw);
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch { /* ignore */ }
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
