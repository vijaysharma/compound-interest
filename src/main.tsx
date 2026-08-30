import { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import LoadingFallback from './components/LoadingFallback.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import './index.css';
const protectedRoute = (
  importer: () => Promise<{ default: ComponentType }>,
  requireAdmin = false
) => {
  return async () => {
    const Component = (await importer()).default;
    const ProtectedComponent = () => (
      <ProtectedRoute requireAdmin={requireAdmin}>
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
        path: 'investment-details',
        lazy: protectedRoute(() => import('./pages/investment_details.tsx')),
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
        path: 'economics',
        children: [
          {
            path: 'inflation-rates',
            lazy: protectedRoute(() => import('./pages/inflationRates.tsx')),
          },
          {
            path: 'ppp-exchange-rate',
            lazy: protectedRoute(() => import('./pages/pppExchangeRate.tsx')),
          },
        ],
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
        path: 'mutual-funds',
        children: [
          {
            path: 'lumpsum',
            lazy: protectedRoute(() => import('./pages/lumpsum.tsx')),
          },
          {
            path: 'sip',
            lazy: protectedRoute(() => import('./pages/sip.tsx')),
          },
          {
            path: 'swp',
            lazy: protectedRoute(() => import('./pages/swp.tsx')),
          },
        ],
      },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
