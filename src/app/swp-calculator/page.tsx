import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/fixedRateSwp';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
