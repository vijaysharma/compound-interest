import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/sip';
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
