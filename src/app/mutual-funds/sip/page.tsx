import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/sip';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.mfSip;
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
