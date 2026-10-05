'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clearPendingLinks, useLocation } from '@/navigation';
import { NAV_INTENT_ATTR } from '@/navigation/prehydrationFeedback';
import { NAV_TITLES } from './topbar/navTitles';
import styles from './NavigationProgressBar.module.scss';
declare global {
  interface Window {
    /** Set once this bar is listening; the pre-hydration inline script stops handling clicks. */
    __navHydrated?: boolean;
  }
}
const clearPrehydrationIntent = () => document.documentElement.removeAttribute(NAV_INTENT_ATTR);
/** Set on <html> while a navigation is pending; dims the current page (_base.scss). */
export const NAV_LOADING_ATTR = 'data-nav-loading';
export const NAV_START_EVENT = 'app:nav-start';
export const NAV_STOP_EVENT = 'app:nav-stop';
// Backstops for a bar whose navigation never lands. A press may turn into a scroll or drag, so it
// gets a short one; a click / navigate() always ends in a route change or document load, so its
// backstop only has to outlast a slow network (a 2s-RTT route can take >6s to commit).
const PRESS_BACKSTOP_MS = 6000;
const NAVIGATION_BACKSTOP_MS = 20000;
/** `pressOnly` for pointerdown-time feedback that may not become a navigation. */
export const startNavigationProgress = (pressOnly = false) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NAV_START_EVENT, { detail: { pressOnly } }));
  }
};
export const stopNavigationProgress = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NAV_STOP_EVENT));
  }
};
export function NavigationProgressBar() {
  const { pathname, search } = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  // Destination page name for the loader card, when the navigation came from a known link.
  const [label, setLabel] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyDeadlineRef = useRef(0);
  // The link under a press that hasn't been confirmed by a click yet, and whether the current
  // run has been confirmed (click, navigate(), back/forward) — a confirmed run is never cancelled.
  const pressedAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const confirmedRef = useRef(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<'idle' | 'loading' | 'completing'>('idle');
  const prevRouteRef = useRef(pathname + search);
  const done = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    clearPendingLinks();
    clearPrehydrationIntent();
    confirmedRef.current = false;
    if (stateRef.current === 'idle') return;
    stateRef.current = 'completing';
    setProgress(100);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      resetTimerRef.current = setTimeout(() => {
        setProgress(0);
        setLabel(null);
        stateRef.current = 'idle';
      }, 200);
    }, 180);
  }, []);
  const start = useCallback((pressOnly = false) => {
    const backstopMs = pressOnly ? PRESS_BACKSTOP_MS : NAVIGATION_BACKSTOP_MS;
    if (!pressOnly) confirmedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    // A press then its click both call start(); the later, shorter backstop must not cut the
    // confirmed navigation's one short.
    const deadline = Date.now() + backstopMs;
    if (stateRef.current !== 'loading' || deadline > safetyDeadlineRef.current) {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      safetyDeadlineRef.current = deadline;
      safetyTimerRef.current = setTimeout(() => {
        done();
      }, backstopMs);
    }
    stateRef.current = 'loading';
    clearPrehydrationIntent();
    setVisible(true);
    setProgress((prev) => (prev > 0 && prev < 90 ? prev : 28));
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 40) return prev + 14;
        if (prev < 65) return prev + 8;
        if (prev < 80) return prev + 4;
        if (prev < 92) return prev + 0.8;
        return prev;
      });
    }, 120);
  }, [done]);
  useEffect(() => {
    const currentRoute = pathname + search;
    if (prevRouteRef.current !== currentRoute) {
      prevRouteRef.current = currentRoute;
      if (stateRef.current === 'loading') {
        done();
      }
    }
  }, [pathname, search, done]);
  useEffect(() => {
    const handleStart = (e: Event) => start(Boolean((e as CustomEvent<{ pressOnly?: boolean }>).detail?.pressOnly));
    const handleStop = () => done();
    const handlePopState = () => start();
    const handlePointerAction = (e: MouseEvent | PointerEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (e.defaultPrevented) return;
      // A touch press may become a scroll; touch feedback starts on the click instead.
      if (e.type === 'pointerdown' && (e as PointerEvent).pointerType !== 'mouse') return;
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);
        if (targetUrl.origin !== currentUrl.origin) return;
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }
        if (e.type === 'pointerdown') pressedAnchorRef.current = anchor;
        setLabel(NAV_TITLES[targetUrl.pathname] ?? null);
        start(e.type !== 'click');
      } catch {
        // ignore malformed URLs
      }
    };
    // A press that becomes a scroll (pointercancel) or is released off the link won't navigate:
    // drop its feedback now instead of leaving a bar up until the press backstop.
    const handlePressEnd = (e: PointerEvent) => {
      const pressed = pressedAnchorRef.current;
      pressedAnchorRef.current = null;
      if (!pressed || confirmedRef.current) return;
      if (e.type === 'pointerup' && pressed.contains(e.target as Node)) return;
      done();
    };
    window.addEventListener(NAV_START_EVENT, handleStart);
    window.addEventListener(NAV_STOP_EVENT, handleStop);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('pointerdown', handlePointerAction, { capture: true, passive: true });
    document.addEventListener('click', handlePointerAction, { capture: true });
    document.addEventListener('pointerup', handlePressEnd, { capture: true, passive: true });
    document.addEventListener('pointercancel', handlePressEnd, { capture: true, passive: true });
    // Take over a click the inline pre-hydration script caught; React replays that click once
    // hydrated, so the navigation itself still runs through Link as usual.
    window.__navHydrated = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (document.documentElement.hasAttribute(NAV_INTENT_ATTR)) start(true);
    return () => {
      window.removeEventListener(NAV_START_EVENT, handleStart);
      window.removeEventListener(NAV_STOP_EVENT, handleStop);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('pointerdown', handlePointerAction, { capture: true });
      document.removeEventListener('click', handlePointerAction, { capture: true });
      document.removeEventListener('pointerup', handlePressEnd, { capture: true });
      document.removeEventListener('pointercancel', handlePressEnd, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [start, done]);
  useEffect(() => {
    document.documentElement.toggleAttribute(NAV_LOADING_ATTR, visible);
  }, [visible]);
  const barRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${progress}%`;
    }
  }, [progress]);
  if (!visible && progress === 0) return null;
  return (
    <>
      <div
        className={`${styles.progressBarContainer} ${visible ? styles.visible : styles.hidden}`}
        aria-hidden="true"
      >
        <div
          ref={(el) => {
            barRef.current = el;
            if (el) el.style.width = `${progress}%`;
          }}
          className={`${styles.progressBar} ${progress === 100 ? styles.complete : ''}`}
        >
          <div className={styles.peg} />
        </div>
      </div>
      {visible && (
        <div className={styles.pageLoader} role="status" aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <span className={styles.pageLoaderText}>{label ? `Opening ${label}…` : 'Loading page…'}</span>
        </div>
      )}
    </>
  );
}
export default NavigationProgressBar;
