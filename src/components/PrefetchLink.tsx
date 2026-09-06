import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { prefetchRoute } from '../utilities/prefetchRoute';
export interface PrefetchLinkProps extends LinkProps {
  children: React.ReactNode;
}
export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  to,
  children,
  onMouseEnter,
  onTouchStart,
  ...props
}) => {
  const handlePrefetch = () => {
    if (typeof to === 'string') {
      prefetchRoute(to);
    } else if (to && typeof to === 'object' && 'pathname' in to && to.pathname) {
      prefetchRoute(to.pathname);
    }
  };
  return (
    <Link
      to={to}
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
