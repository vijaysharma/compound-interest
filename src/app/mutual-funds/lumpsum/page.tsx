import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/lumpsum';
export default function Page() {
  return (
    <ProtectedRoute requireApiQuota>
      <PageComponent />
    </ProtectedRoute>
  );
}
