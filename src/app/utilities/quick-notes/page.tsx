import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/quickNotesPage';
export default function Page() {
  return (
    <ProtectedRoute requirePaid>
      <PageComponent />
    </ProtectedRoute>
  );
}
