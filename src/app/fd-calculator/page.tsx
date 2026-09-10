import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/fd';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
