import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/admin';
export default function Page() {
  return (
    <ProtectedRoute requireAdmin>
      <PageComponent />
    </ProtectedRoute>
  );
}
