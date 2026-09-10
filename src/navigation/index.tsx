'use client';
import React from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
        if (to === -1) {
          router.back();
        } else if (to === 1) {
          router.forward();
        }
        return;
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
  ({ to, href, replace, scroll, prefetch = true, state: _ = undefined, ...props }, ref) => {
    const rawTarget = href ?? to ?? '/';
    let target = '/';
    if (typeof rawTarget === 'string') {
      target = rawTarget;
    } else if (rawTarget && typeof rawTarget === 'object' && rawTarget.pathname) {
      target = `${rawTarget.pathname}${rawTarget.search || ''}${rawTarget.hash || ''}`;
    }
    return (
      <NextLink
        ref={ref}
        href={target}
        replace={replace}
        scroll={scroll}
        prefetch={prefetch}
        {...props}
      />
    );
  }
);
Link.displayName = 'Link';
export default Link;
