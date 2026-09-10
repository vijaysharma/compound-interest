import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/fixedRateSip';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
