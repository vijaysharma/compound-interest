import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/lumpsum';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.mfLumpsum;
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
