import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/rd';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.rdCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
