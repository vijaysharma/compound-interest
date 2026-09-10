import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/calculator';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
