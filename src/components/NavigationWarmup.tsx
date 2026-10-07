'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NAVIGATION_SECTIONS } from '@/data/navigation';
// Every route in the nav is statically prerendered, so a prefetched one navigates with no request
// at click time. Prefetching only on hover/press left each click exposed to the network: on a
// stalled connection its RSC requests were held for up to ~30s while the old page stayed up.
// Warming them once the app is idle (a few KB each from the CDN) makes nav clicks network-free.
// Warming all ~33 at once fired ~67 requests alongside the page's own data loads (a PPF passbook,
// a NAV history) and on a stalling connection they timed out together, so the warm-up starts
// later and goes a few routes per idle period.
const WARM_DELAY_MS = 6000;
const WARM_BATCH_SIZE = 4;
const WARM_BATCH_GAP_MS = 750;
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
    const whenIdle = (fn: () => void) => {
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(fn, { timeout: 5000 });
      } else {
        delayTimer = setTimeout(fn, 0);
      }
    };
    const warmBatch = (start: number) => {
      if (shouldSkipWarmup() || document.visibilityState !== 'visible') return;
      for (const href of NAV_HREFS.slice(start, start + WARM_BATCH_SIZE)) {
        try {
          router.prefetch(href);
        } catch {
          // prefetch is best-effort
        }
      }
      const next = start + WARM_BATCH_SIZE;
      if (next < NAV_HREFS.length) {
        delayTimer = setTimeout(() => whenIdle(() => warmBatch(next)), WARM_BATCH_GAP_MS);
      }
    };
    const warmWhenIdle = () => {
      lastWarmAt = Date.now();
      whenIdle(() => warmBatch(0));
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
