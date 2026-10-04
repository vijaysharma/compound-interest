'use client';
import React from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { startNavigationProgress, stopNavigationProgress } from '@/components/NavigationProgressBar';
export { startNavigationProgress, stopNavigationProgress };
export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}
export type NavigateFunction = (to: string | number, options?: NavigateOptions) => void;
export function useNavigate(): NavigateFunction {
  const router = useRouter();
  return React.useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        startNavigationProgress();
        if (to === -1) {
          router.back();
        } else if (to === 1) {
          router.forward();
        }
        return;
      }
      const targetStr = typeof to === 'string' ? to : '';
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      if (targetStr && targetStr !== currentPath) {
        startNavigationProgress();
      }
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router]
  );
}
export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  key: string;
}
const emptySubscribe = () => () => {};
export function useLocation(): Location {
  const pathname = usePathname();
  const search = React.useSyncExternalStore(
    emptySubscribe,
    () => window.location.search,
    () => ''
  );
  const hash = React.useSyncExternalStore(
    emptySubscribe,
    () => window.location.hash,
    () => ''
  );
  return {
    pathname: pathname || '/',
    search,
    hash,
    state: null,
    key: pathname || 'default',
  };
}
/** Marks the link the user just activated until the route change lands (styled in _base.scss). */
export const NAV_PENDING_ATTR = 'data-nav-pending';
export const clearPendingLinks = () => {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(`[${NAV_PENDING_ATTR}]`).forEach((el) => el.removeAttribute(NAV_PENDING_ATTR));
};
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string | { pathname: string; search?: string; hash?: string };
  href?: string | { pathname: string; search?: string; hash?: string };
  replace?: boolean;
  scroll?: boolean;
  /**
   * 'intent' (default) prefetches as soon as the user points at, touches or focuses the link, so a
   * tap normally lands on an already-fetched route without the app eagerly prefetching every link
   * in the sidebar. `null`/`true` hand control back to Next.js (viewport prefetch) — use them for a
   * handful of high-traffic links. `false` disables prefetching entirely.
   */
  prefetch?: boolean | null | 'intent';
  state?: unknown;
}
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      to,
      href,
      replace,
      scroll,
      prefetch = 'intent',
      state: _ = undefined,
      onClick,
      onPointerEnter,
      onPointerDown,
      onTouchStart,
      onFocus,
      ...props
    },
    ref
  ) => {
    const router = useRouter();
    const rawTarget = href ?? to ?? '/';
    let target = '/';
    if (typeof rawTarget === 'string') {
      target = rawTarget;
    } else if (rawTarget && typeof rawTarget === 'object' && rawTarget.pathname) {
      target = `${rawTarget.pathname}${rawTarget.search || ''}${rawTarget.hash || ''}`;
    }
    const prefetchedRef = React.useRef(false);
    const prefetchOnIntent = () => {
      if (prefetch !== 'intent' || prefetchedRef.current || !target.startsWith('/')) return;
      prefetchedRef.current = true;
      try {
        router.prefetch(target);
      } catch {
        // prefetch is best-effort
      }
    };
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      const targetClean = target.split('#')[0];
      if (!targetClean || targetClean === currentPath) return;
      e.currentTarget.setAttribute(NAV_PENDING_ATTR, '');
      startNavigationProgress();
    };
    return (
      <NextLink
        ref={ref}
        href={target}
        replace={replace}
        scroll={scroll}
        prefetch={prefetch === 'intent' ? false : prefetch}
        onClick={handleClick}
        onPointerEnter={(e) => {
          prefetchOnIntent();
          onPointerEnter?.(e);
        }}
        onPointerDown={(e) => {
          prefetchOnIntent();
          if (!e.defaultPrevented && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
            const targetClean = target.split('#')[0];
            if (targetClean && targetClean !== currentPath) {
              e.currentTarget.setAttribute(NAV_PENDING_ATTR, '');
              startNavigationProgress();
            }
          }
          onPointerDown?.(e);
        }}
        onTouchStart={(e) => {
          prefetchOnIntent();
          onTouchStart?.(e);
        }}
        onFocus={(e) => {
          prefetchOnIntent();
          onFocus?.(e);
        }}
        {...props}
      />
    );
  }
);
Link.displayName = 'Link';
export default Link;
