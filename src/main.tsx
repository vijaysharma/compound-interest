import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import LoadingFallback from './components/LoadingFallback.tsx';
import './index.css';
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    HydrateFallback: LoadingFallback,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/home.tsx')).default }) },
      { path: 'admin', lazy: async () => ({ Component: (await import('./pages/admin.tsx')).default }) },
      { path: 'emi', lazy: async () => ({ Component: (await import('./pages/emiCalculator.tsx')).default }) },
      {
        path: 'deposits',
        children: [
          { path: 'fd', lazy: async () => ({ Component: (await import('./pages/fd.tsx')).default }) },
          { path: 'rd', lazy: async () => ({ Component: (await import('./pages/rd.tsx')).default }) },
        ],
      },
      {
        path: 'economics',
        children: [
          { path: 'inflation-rates', lazy: async () => ({ Component: (await import('./pages/inflationRates.tsx')).default }) },
          { path: 'ppp-exchange-rate', lazy: async () => ({ Component: (await import('./pages/pppExchangeRate.tsx')).default }) },
        ],
      },
      {
        path: 'fixed-plans',
        children: [
          { path: 'fixed-rate-sip', lazy: async () => ({ Component: (await import('./pages/fixedRateSip.tsx')).default }) },
          { path: 'fixed-rate-swp', lazy: async () => ({ Component: (await import('./pages/fixedRateSwp.tsx')).default }) },
        ],
      },
      {
        path: 'mutual-funds',
        children: [
          { path: 'lumpsum', lazy: async () => ({ Component: (await import('./pages/lumpsum.tsx')).default }) },
          { path: 'sip', lazy: async () => ({ Component: (await import('./pages/sip.tsx')).default }) },
          { path: 'swp', lazy: async () => ({ Component: (await import('./pages/swp.tsx')).default }) },
        ],
      },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
