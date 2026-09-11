import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/dateCalculator';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
