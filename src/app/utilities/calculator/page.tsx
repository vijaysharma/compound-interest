import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/calculator';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.calculator;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
