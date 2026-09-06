import { ComponentType, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import Home from './pages/home.tsx';
import LoadingFallback from './components/LoadingFallback.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import './index.css';
const lazyProtected = (
  importer: () => Promise<{ default: ComponentType }>,
  requireAdmin = false,
  requireApiQuota = false,
  requirePaid = false
) => {
  const LazyComponent = lazy(importer);
  return (
    <ProtectedRoute
      requireAdmin={requireAdmin}
      requireApiQuota={requireApiQuota}
      requirePaid={requirePaid}
    >
      <LazyComponent />
    </ProtectedRoute>
  );
};
const lazyPublic = (importer: () => Promise<{ default: ComponentType }>) => {
  const LazyComponent = lazy(importer);
  return <LazyComponent />;
};
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    HydrateFallback: LoadingFallback,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'login',
        element: lazyPublic(() => import('./pages/login.tsx')),
      },
      {
        path: 'upgrade',
        element: lazyPublic(() => import('./pages/upgrade.tsx')),
      },
      {
        path: 'admin',
        element: lazyProtected(() => import('./pages/admin.tsx'), true),
      },
      {
        path: 'admin/shiprocket-rates',
        element: lazyProtected(() => import('./pages/admin/shiprocketRatesPage.tsx'), true),
      },
      {
        path: 'admin/volumetric-weight',
        element: lazyProtected(() => import('./pages/admin/volumetricWeightPage.tsx'), true),
      },
      {
        path: 'admin/wood-calculator',
        element: lazyProtected(() => import('./pages/admin/woodCalculatorPage.tsx'), true),
      },
      {
        path: 'utilities/quick-notes',
        element: lazyProtected(() => import('./pages/quickNotesPage.tsx'), false, false, true),
      },
      {
        path: 'admin/quick-notes',
        element: lazyProtected(() => import('./pages/quickNotesPage.tsx'), false, false, true),
      },
      {
        path: 'admin/notes',
        element: lazyProtected(() => import('./pages/quickNotesPage.tsx'), false, false, true),
      },
      {
        path: 'notes',
        element: lazyProtected(() => import('./pages/quickNotesPage.tsx'), false, false, true),
      },
      {
        path: 'about',
        element: lazyPublic(() => import('./pages/about.tsx')),
      },
      {
        path: 'privacy',
        element: lazyPublic(() => import('./pages/privacy.tsx')),
      },
      {
        path: 'disclaimer',
        element: lazyPublic(() => import('./pages/disclaimer.tsx')),
      },
      {
        path: 'emi-calculator',
        element: lazyProtected(() => import('./pages/emiCalculator.tsx')),
      },
      {
        path: 'fd-calculator',
        element: lazyProtected(() => import('./pages/fd.tsx')),
      },
      {
        path: 'rd-calculator',
        element: lazyProtected(() => import('./pages/rd.tsx')),
      },
      {
        path: 'compound-interest-calculator',
        element: lazyProtected(() => import('./pages/fd.tsx')),
      },
      {
        path: 'inflation-calculator',
        element: lazyProtected(() => import('./pages/inflationRates.tsx'), false, true),
      },
      {
        path: 'ppp-calculator',
        element: lazyProtected(() => import('./pages/pppExchangeRate.tsx'), false, true),
      },
      {
        path: 'currency-converter',
        element: lazyProtected(() => import('./pages/currencyConverter.tsx')),
      },
      {
        path: 'sip-calculator',
        element: lazyProtected(() => import('./pages/fixedRateSip.tsx')),
      },
      {
        path: 'swp-calculator',
        element: lazyProtected(() => import('./pages/fixedRateSwp.tsx')),
      },
      {
        path: 'calculator',
        element: lazyProtected(() => import('./pages/calculator.tsx')),
      },
      {
        path: 'date-calculator',
        element: lazyProtected(() => import('./pages/dateCalculator.tsx')),
      },
      {
        path: 'utilities',
        children: [
          {
            path: 'calculator',
            element: lazyProtected(() => import('./pages/calculator.tsx')),
          },
          {
            path: 'date-calculator',
            element: lazyProtected(() => import('./pages/dateCalculator.tsx')),
          },
          {
            path: 'unit-converter',
            element: lazyProtected(() => import('./pages/unitConverter.tsx')),
          },
          {
            path: 'currency-converter',
            element: lazyProtected(() => import('./pages/currencyConverter.tsx')),
          },
          {
            path: 'quick-notes',
            element: lazyProtected(() => import('./pages/quickNotesPage.tsx'), false, false, true),
          },
        ],
      },
      {
        path: 'mutual-funds',
        children: [
          {
            path: 'lumpsum',
            element: lazyProtected(() => import('./pages/lumpsum.tsx'), false, true),
          },
          {
            path: 'sip',
            element: lazyProtected(() => import('./pages/sip.tsx'), false, true),
          },
          {
            path: 'swp',
            element: lazyProtected(() => import('./pages/swp.tsx'), false, true),
          },
        ],
      },
      {
        path: 'emi',
        element: lazyProtected(() => import('./pages/emiCalculator.tsx')),
      },
      {
        path: 'deposits',
        children: [
          {
            path: 'fd',
            element: lazyProtected(() => import('./pages/fd.tsx')),
          },
          {
            path: 'rd',
            element: lazyProtected(() => import('./pages/rd.tsx')),
          },
        ],
      },
      {
        path: 'fixed-plans',
        children: [
          {
            path: 'fixed-rate-sip',
            element: lazyProtected(() => import('./pages/fixedRateSip.tsx')),
          },
          {
            path: 'fixed-rate-swp',
            element: lazyProtected(() => import('./pages/fixedRateSwp.tsx')),
          },
        ],
      },
      {
        path: 'economics',
        children: [
          {
            path: 'inflation-rates',
            element: lazyProtected(() => import('./pages/inflationRates.tsx'), false, true),
          },
          {
            path: 'ppp-exchange-rate',
            element: lazyProtected(() => import('./pages/pppExchangeRate.tsx'), false, true),
          },
          {
            path: 'currency-converter',
            element: lazyProtected(() => import('./pages/currencyConverter.tsx')),
          },
        ],
      },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
