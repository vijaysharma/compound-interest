import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/ppfCalculator';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
