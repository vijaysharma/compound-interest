'use client';
import React from 'react';
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
  const target = href ?? to;
  const handlePrefetch = () => {
    if (typeof target === 'string') {
      prefetchRoute(target);
    } else if (target && typeof target === 'object' && 'pathname' in target && target.pathname) {
      prefetchRoute(target.pathname);
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
