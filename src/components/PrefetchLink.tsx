'use client';
import React, { useRef } from 'react';
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
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  ...props
}) => {
  const router = useRouter();
  const target = href ?? to;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      onMouseEnter={(e) => {
        // 120ms intent delay: only prefetch when user genuinely hovers,
        // avoiding rapid cursor brush-by triggering premature CSS preloads
        timeoutRef.current = setTimeout(handlePrefetch, 120);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        onMouseLeave?.(e);
      }}
      onTouchStart={(e) => {
        // Prevent aggressive router prefetch during mobile touch scrolls
        onTouchStart?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
};
export default PrefetchLink;
