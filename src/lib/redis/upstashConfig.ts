export interface UpstashConfig {
  url: string;
  token: string;
}
export function getUpstashConfig(): UpstashConfig | null {
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
export function parseRedisJson<T>(raw: string | null | undefined): T | null {
  if (raw === null || raw === undefined) return null;
  try {
    let parsed = JSON.parse(raw);
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { /* ignore */ }
    }
    return parsed as T;
  } catch {
    return raw as unknown as T;
  }
}
