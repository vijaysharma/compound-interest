'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from '@/navigation';
import styles from './NavigationProgressBar.module.scss';
export const NAV_START_EVENT = 'app:nav-start';
export const NAV_STOP_EVENT = 'app:nav-stop';
export const startNavigationProgress = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NAV_START_EVENT));
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
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
    if (stateRef.current === 'idle') return;
    stateRef.current = 'completing';
    setProgress(100);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      resetTimerRef.current = setTimeout(() => {
        setProgress(0);
        stateRef.current = 'idle';
      }, 200);
    }, 180);
  }, []);
  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    stateRef.current = 'loading';
    setVisible(true);
    setProgress((prev) => (prev > 0 && prev < 90 ? prev : 18));
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 40) return prev + 12;
        if (prev < 65) return prev + 6;
        if (prev < 80) return prev + 3;
        if (prev < 92) return prev + 0.8;
        return prev;
      });
    }, 120);
    safetyTimerRef.current = setTimeout(() => {
      done();
    }, 6000);
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
    const handleStart = () => start();
    const handleStop = () => done();
    const handlePopState = () => start();
    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (e.defaultPrevented) return;
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
        start();
      } catch {
        // ignore malformed URLs
      }
    };
    window.addEventListener(NAV_START_EVENT, handleStart);
    window.addEventListener(NAV_STOP_EVENT, handleStop);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      window.removeEventListener(NAV_START_EVENT, handleStart);
      window.removeEventListener(NAV_STOP_EVENT, handleStop);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [start, done]);
  if (!visible && progress === 0) return null;
  return (
    <div
      className={styles.progressBarContainer}
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className={styles.progressBar}
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 150ms ease-out' : 'width 200ms cubic-bezier(0.1, 0.5, 0.5, 1)',
        }}
      >
        <div className={styles.peg} />
      </div>
    </div>
  );
}
export default NavigationProgressBar;
