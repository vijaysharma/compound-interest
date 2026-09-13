import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/emiCalculator';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.emiCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
