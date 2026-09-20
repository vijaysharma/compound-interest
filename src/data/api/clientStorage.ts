import { trackUsageAction } from '@/actions/auth';
export const CLIENT_NAV_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30-day client cache
export function getSessionItem<T>(key: string, maxAgeMs = 30 * 24 * 60 * 60 * 1000): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - parsed.ts < maxAgeMs) {
      return parsed.data;
    }
  } catch {
    // Ignore sessionStorage read errors
  }
  return null;
}
export function setSessionItem<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore sessionStorage quota errors
  }
}
let usageTimeout: ReturnType<typeof setTimeout> | null = null;
export const recordApiUsage = () => {
  if (usageTimeout) return;
  usageTimeout = setTimeout(async () => {
    usageTimeout = null;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      await trackUsageAction(token, 'api');
    } catch (err) {
      console.warn('Failed to record API usage:', err);
    }
  }, 3000);
};
