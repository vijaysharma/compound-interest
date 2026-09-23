'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Link, LinkProps } from '@/navigation';
import { prefetchRoute } from '../utilities/prefetchRoute';
export interface PrefetchLinkProps extends LinkProps {
  children: React.ReactNode;
}
const prefetchedPaths = new Set<string>();
export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  to,
  href,
  children,
  onMouseDown,
  onPointerDown,
  ...props
}) => {
  const router = useRouter();
  const target = href ?? to;
  const getCleanPath = (): string | undefined => {
    if (typeof target === 'string') {
      return target.split('?')[0].split('#')[0];
    }
    if (target && typeof target === 'object' && 'pathname' in target && target.pathname) {
      return target.pathname;
    }
    return undefined;
  };
  const handlePrefetch = () => {
    const cleanPath = getCleanPath();
    if (!cleanPath || prefetchedPaths.has(cleanPath)) return;
    prefetchedPaths.add(cleanPath);
    prefetchRoute(cleanPath);
    if (cleanPath.startsWith('/')) {
      try {
        router.prefetch(cleanPath);
      } catch {
        // ignore prefetch errors
      }
    }
  };
  return (
    <Link
      to={to}
      href={href}
      /*
       * Warm the route on intent, not on the click.
       *
       * Prefetching only fired on mouse/pointer *down*, which is the same tick
       * the navigation starts in — by then it saves nothing. Hover on a pointer
       * device, and focus for keyboard users, give the route a head start of
       * however long it takes to move a finger. `touchstart` covers mobile,
       * where there is no hover to work with but still a gap between the finger
       * landing and the tap completing.
       *
       * `prefetchedPaths` makes all of these idempotent, so firing from several
       * events costs one prefetch.
       */
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onTouchStart={handlePrefetch}
      onMouseDown={(e) => {
        handlePrefetch();
        onMouseDown?.(e);
      }}
      onPointerDown={(e) => {
        handlePrefetch();
        onPointerDown?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
};
export default PrefetchLink;
