import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/incomeTaxCalculator';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
