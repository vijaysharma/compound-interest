'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NAVIGATION_SECTIONS } from '@/data/navigation';
// Every route in the nav is statically prerendered, so a prefetched one navigates with no request
// at click time. Prefetching only on hover/press left each click exposed to the network: on a
// stalled connection its RSC requests were held for up to ~30s while the old page stayed up.
// Warming them once the app is idle (a few KB each from the CDN) makes nav clicks network-free.
const WARM_DELAY_MS = 2500;
// Within `experimental.staleTimes.static` (next.config.ts), so the cache never goes cold.
const REWARM_INTERVAL_MS = 30 * 60 * 1000;
const NAV_HREFS = Array.from(
  new Set(NAVIGATION_SECTIONS.flatMap((section) => section.items.map((item) => item.href)))
);
interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}
const shouldSkipWarmup = () => {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return Boolean(connection?.saveData || connection?.effectiveType?.includes('2g'));
};
export function NavigationWarmup() {
  const router = useRouter();
  useEffect(() => {
    // Dev compiles each route on first request; warming them all would stall the dev server.
    if (process.env.NODE_ENV !== 'production') return;
    let lastWarmAt = 0;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: number | null = null;
    const warm = () => {
      if (shouldSkipWarmup()) return;
      lastWarmAt = Date.now();
      for (const href of NAV_HREFS) {
        try {
          router.prefetch(href);
        } catch {
          // prefetch is best-effort
        }
      }
    };
    const warmWhenIdle = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(warm, { timeout: 5000 });
      } else {
        warm();
      }
    };
    const rewarmIfStale = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastWarmAt >= REWARM_INTERVAL_MS) {
        warmWhenIdle();
      }
    };
    delayTimer = setTimeout(warmWhenIdle, WARM_DELAY_MS);
    const interval = setInterval(rewarmIfStale, REWARM_INTERVAL_MS);
    document.addEventListener('visibilitychange', rewarmIfStale);
    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }
      clearInterval(interval);
      document.removeEventListener('visibilitychange', rewarmIfStale);
    };
  }, [router]);
  return null;
}
export default NavigationWarmup;
