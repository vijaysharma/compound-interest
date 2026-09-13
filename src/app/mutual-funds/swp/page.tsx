import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/swp';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.mfSwp;
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
