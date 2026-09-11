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
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string | { pathname: string; search?: string; hash?: string };
  href?: string | { pathname: string; search?: string; hash?: string };
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  state?: unknown;
}
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, href, replace, scroll, prefetch = true, state: _ = undefined, onClick, ...props }, ref) => {
    const rawTarget = href ?? to ?? '/';
    let target = '/';
    if (typeof rawTarget === 'string') {
      target = rawTarget;
    } else if (rawTarget && typeof rawTarget === 'object' && rawTarget.pathname) {
      target = `${rawTarget.pathname}${rawTarget.search || ''}${rawTarget.hash || ''}`;
    }
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!e.defaultPrevented && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        const targetClean = target.split('#')[0];
        if (targetClean && targetClean !== currentPath) {
          startNavigationProgress();
        }
      }
      onClick?.(e);
    };
    return (
      <NextLink
        ref={ref}
        href={target}
        replace={replace}
        scroll={scroll}
        prefetch={prefetch}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Link.displayName = 'Link';
export default Link;
