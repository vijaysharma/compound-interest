import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/rd';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
