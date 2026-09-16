import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/lumpsum';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.mfLumpsum;
export const maxDuration = 30;
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
