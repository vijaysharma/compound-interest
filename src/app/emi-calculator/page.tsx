import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/emiCalculator';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
