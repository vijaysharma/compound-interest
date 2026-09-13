import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/fd';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.fdCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
