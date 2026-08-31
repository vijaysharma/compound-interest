import { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import LoadingFallback from './components/LoadingFallback.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import './index.css';

const protectedRoute = (
  importer: () => Promise<{ default: ComponentType }>,
  requireAdmin = false,
  requireApiQuota = false
) => {
  return async () => {
    const Component = (await importer()).default;
    const ProtectedComponent = () => (
      <ProtectedRoute requireAdmin={requireAdmin} requireApiQuota={requireApiQuota}>
        <Component />
      </ProtectedRoute>
    );
    return { Component: ProtectedComponent };
  };
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    HydrateFallback: LoadingFallback,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/home.tsx')).default }),
      },
      {
        path: 'login',
        lazy: async () => ({ Component: (await import('./pages/login.tsx')).default }),
      },
      {
        path: 'upgrade',
        lazy: async () => ({ Component: (await import('./pages/upgrade.tsx')).default }),
      },
      {
        path: 'admin',
        lazy: protectedRoute(() => import('./pages/admin.tsx'), true),
      },
      {
        path: 'emi',
        lazy: protectedRoute(() => import('./pages/emiCalculator.tsx')),
      },
      {
        path: 'emi-calculator',
        lazy: protectedRoute(() => import('./pages/emiCalculator.tsx')),
      },
      {
        path: 'deposits',
        children: [
          {
            path: 'fd',
            lazy: protectedRoute(() => import('./pages/fd.tsx')),
          },
          {
            path: 'rd',
            lazy: protectedRoute(() => import('./pages/rd.tsx')),
          },
        ],
      },
      {
        path: 'fd-calculator',
        lazy: protectedRoute(() => import('./pages/fd.tsx')),
      },
      {
        path: 'rd-calculator',
        lazy: protectedRoute(() => import('./pages/rd.tsx')),
      },
      {
        path: 'compound-interest-calculator',
        lazy: protectedRoute(() => import('./pages/fd.tsx')),
      },
      {
        path: 'economics',
        children: [
          {
            path: 'inflation-rates',
            lazy: protectedRoute(() => import('./pages/inflationRates.tsx')),
          },
          {
            path: 'ppp-exchange-rate',
            lazy: protectedRoute(() => import('./pages/pppExchangeRate.tsx'), false, true),
          },
        ],
      },
      {
        path: 'inflation-calculator',
        lazy: protectedRoute(() => import('./pages/inflationRates.tsx')),
      },
      {
        path: 'ppp-calculator',
        lazy: protectedRoute(() => import('./pages/pppExchangeRate.tsx'), false, true),
      },
      {
        path: 'fixed-plans',
        children: [
          {
            path: 'fixed-rate-sip',
            lazy: protectedRoute(() => import('./pages/fixedRateSip.tsx')),
          },
          {
            path: 'fixed-rate-swp',
            lazy: protectedRoute(() => import('./pages/fixedRateSwp.tsx')),
          },
        ],
      },
      {
        path: 'sip-calculator',
        lazy: protectedRoute(() => import('./pages/fixedRateSip.tsx')),
      },
      {
        path: 'swp-calculator',
        lazy: protectedRoute(() => import('./pages/fixedRateSwp.tsx')),
      },
      {
        path: 'mutual-funds',
        children: [
          {
            path: 'lumpsum',
            lazy: protectedRoute(() => import('./pages/lumpsum.tsx'), false, true),
          },
          {
            path: 'sip',
            lazy: protectedRoute(() => import('./pages/sip.tsx'), false, true),
          },
          {
            path: 'swp',
            lazy: protectedRoute(() => import('./pages/swp.tsx'), false, true),
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
