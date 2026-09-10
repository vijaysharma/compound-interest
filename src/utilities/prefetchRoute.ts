const prefetchedRoutes = new Set<string>();
export const prefetchRoute = (path: string): void => {
  if (!path || typeof path !== 'string') return;
  const cleanPath = path.split('?')[0].split('#')[0];
  if (prefetchedRoutes.has(cleanPath)) return;
  prefetchedRoutes.add(cleanPath);
};
