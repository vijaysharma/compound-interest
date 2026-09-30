import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/admin/shiprocketAccountsPage';
export default function Page() {
  return (
    <ProtectedRoute requireAdmin>
      <PageComponent />
    </ProtectedRoute>
  );
}
