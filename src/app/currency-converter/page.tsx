import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/currencyConverter';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.currencyConverter;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
