import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/fixedRateSip';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.sipCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
