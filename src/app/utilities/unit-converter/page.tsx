import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/unitConverter';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.unitConverter;
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
