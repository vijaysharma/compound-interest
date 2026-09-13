import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/npsCalculator';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.npsCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
