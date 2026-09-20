import { Metadata } from 'next';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/strategy-calculator';
import { createPageMetadata } from '@/data/seoMetadata';
export const metadata: Metadata = createPageMetadata({
  title: 'Multi-Stage Investment & SWP/SIP Strategy Calculator | Rupee Calculator',
  description: 'Simulate multi-stage wealth strategies: initial lumpsum deployment, staged SWP redemptions with step-ups, parallel SIP compounding, and stage-wise capital gains tax tracking.',
  keywords: ['SWP calculator', 'multi stage investment', 'SIP step up calculator', 'mutual fund strategy', 'capital gains tax', 'STCG', 'LTCG', 'systematic withdrawal plan'],
  canonicalPath: '/mutual-funds/strategy',
});
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
