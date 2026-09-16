import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/propertyTax';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.propertyTaxCalculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
