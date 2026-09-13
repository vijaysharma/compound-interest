import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/inflationRates';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.inflationCalculator;
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
