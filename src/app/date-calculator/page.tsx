import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/dateCalculator';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.dateCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
