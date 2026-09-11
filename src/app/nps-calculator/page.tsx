import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/npsCalculator';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
