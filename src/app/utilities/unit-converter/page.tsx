import ProtectedRoute from '@/components/ProtectedRoute';
import PageComponent from '@/views/unitConverter';
export default function Page() {
  return (
    <ProtectedRoute>
      <PageComponent />
    </ProtectedRoute>
  );
}
