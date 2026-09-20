import { Metadata } from 'next';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/strategy-calculator';
import { createPageMetadata } from '@/data/seoMetadata';
export const metadata: Metadata = createPageMetadata({
  title: 'Historical NAV Strategy Calculator — SWP, SIP & Reinvestment Backtest | Rupee Calculator',
  description: 'Backtest a mutual fund strategy on actual AMFI NAV history: an initial lumpsum, staged withdrawals, SIPs across multiple funds, SWPs split between personal use and reinvestment, and reinvestment back into the original fund.',
  keywords: ['historical NAV calculator', 'mutual fund strategy backtest', 'SWP calculator', 'SIP calculator', 'reinvestment calculator', 'AMFI NAV history', 'actual NAV portfolio value'],
  canonicalPath: '/strategy-calculator',
});
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
