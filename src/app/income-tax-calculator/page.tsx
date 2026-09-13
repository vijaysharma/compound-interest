import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/incomeTaxCalculator';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.incomeTaxCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
