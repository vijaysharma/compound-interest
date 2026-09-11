'use client';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from '@/navigation';
const LAST_VISITED_ROUTE_KEY = 'last_visited_route';
const STAY_ON_HOME_SESSION_KEY = 'stay_on_home';
const IGNORED_ROUTES = ['/login', '/upgrade'];
const isValidPersistedRoute = (route: string | null | undefined): boolean => {
  if (!route || typeof route !== 'string') return false;
  if (!route.startsWith('/')) return false;
  const pathname = route.split('?')[0].split('#')[0];
  if (IGNORED_ROUTES.includes(pathname)) return false;
  return true;
};
export const RouteTracker = () => {
  const { pathname, search, hash, state } = useLocation();
  const navigate = useNavigate();
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (!isInitialMountRef.current) return;
    isInitialMountRef.current = false;
    const isExplicitHome = Boolean(
      (state as { stayOnHome?: boolean })?.stayOnHome ||
      sessionStorage.getItem(STAY_ON_HOME_SESSION_KEY) === 'true'
    );
    if (pathname === '/' && !isExplicitHome) {
      try {
        const savedRoute = localStorage.getItem(LAST_VISITED_ROUTE_KEY);
        if (savedRoute && savedRoute !== '/' && isValidPersistedRoute(savedRoute)) {
          navigate(savedRoute, { replace: true });
          return;
        }
      } catch {
        // localStorage may be unavailable
      }
    }
    if (pathname === '/' && isExplicitHome) {
      try {
        sessionStorage.setItem(STAY_ON_HOME_SESSION_KEY, 'true');
        localStorage.setItem(LAST_VISITED_ROUTE_KEY, '/');
      } catch {
        // ignore
      }
    }
  }, [pathname, state, navigate]);
  useEffect(() => {
    const fullPath = pathname + search + hash;
    if (pathname === '/') {
      if ((state as { stayOnHome?: boolean })?.stayOnHome) {
        try {
          sessionStorage.setItem(STAY_ON_HOME_SESSION_KEY, 'true');
          localStorage.setItem(LAST_VISITED_ROUTE_KEY, '/');
        } catch {
          // ignore
        }
      }
      return;
    }
    if (isValidPersistedRoute(pathname)) {
      try {
        sessionStorage.removeItem(STAY_ON_HOME_SESSION_KEY);
        localStorage.setItem(LAST_VISITED_ROUTE_KEY, fullPath);
      } catch {
        // ignore
      }
    }
  }, [pathname, search, hash, state]);
  return null;
};
export default RouteTracker;
