import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/quickNotesPage';
import { SEO_PAGES } from '@/data/seoMetadata';
export const metadata = SEO_PAGES.quickNotes;
export default function Page() {
  return (
    <ProtectedRoute requirePaid>
      <PageComponent />
    </ProtectedRoute>
  );
}
