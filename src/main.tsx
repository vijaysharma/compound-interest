import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import EmiCalculator from './pages/emiCalculator.tsx';
import Home from './pages/home.tsx';
// Group pages
import FD from './pages/fd.tsx';
import RD from './pages/rd.tsx';
import InflationRates from './pages/inflationRates.tsx';
import PPPExchangeRate from './pages/pppExchangeRate.tsx';
import FixedRateSIP from './pages/fixedRateSip.tsx';
import FixedRateSWP from './pages/fixedRateSwp.tsx';
import Lumpsum from './pages/lumpsum.tsx';
import SIP from './pages/sip.tsx';
import SWP from './pages/swp.tsx';
import './index.css';
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'emi', element: <EmiCalculator /> },
      // Group 1: Deposits
      {
        path: 'deposits',
        children: [
          { path: 'fd', element: <FD /> },
          { path: 'rd', element: <RD /> },
        ],
      },
      // Group 2: Economics
      {
        path: 'economics',
        children: [
          { path: 'inflation-rates', element: <InflationRates /> },
          { path: 'ppp-exchange-rate', element: <PPPExchangeRate /> },
        ],
      },
      // Group 3: Fixed Plans
      {
        path: 'fixed-plans',
        children: [
          { path: 'fixed-rate-sip', element: <FixedRateSIP /> },
          { path: 'fixed-rate-swp', element: <FixedRateSWP /> },
        ],
      },
      // Group 4: Mutual Funds
      {
        path: 'mutual-funds',
        children: [
          { path: 'lumpsum', element: <Lumpsum /> },
          { path: 'sip', element: <SIP /> },
          { path: 'swp', element: <SWP /> },
        ],
      },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
