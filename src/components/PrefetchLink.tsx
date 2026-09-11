'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Link, LinkProps } from '@/navigation';
import { prefetchRoute } from '../utilities/prefetchRoute';
export interface PrefetchLinkProps extends LinkProps {
  children: React.ReactNode;
}
export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  to,
  href,
  children,
  onMouseEnter,
  onTouchStart,
  ...props
}) => {
  const router = useRouter();
  const target = href ?? to;
  const handlePrefetch = () => {
    let cleanPath: string | undefined;
    if (typeof target === 'string') {
      cleanPath = target.split('?')[0].split('#')[0];
    } else if (target && typeof target === 'object' && 'pathname' in target && target.pathname) {
      cleanPath = target.pathname;
    }
    if (cleanPath) {
      prefetchRoute(cleanPath);
      if (cleanPath.startsWith('/')) {
        try {
          router.prefetch(cleanPath);
        } catch {
          // ignore prefetch errors
        }
      }
    }
  };
  return (
    <Link
      to={to}
      href={href}
      onMouseEnter={(e) => {
        handlePrefetch();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        handlePrefetch();
        onTouchStart?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
};
export default PrefetchLink;
