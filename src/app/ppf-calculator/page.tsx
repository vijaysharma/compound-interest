import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/ppfCalculator';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.ppfCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
