import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/swp';
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
