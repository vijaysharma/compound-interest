import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/inflationRates';
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
