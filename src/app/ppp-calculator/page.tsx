import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/pppExchangeRate';
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
