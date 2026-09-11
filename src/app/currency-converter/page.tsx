import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/currencyConverter';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
