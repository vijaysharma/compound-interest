import React from 'react';
import QuickNotes from '../components/admin/QuickNotes';
import { useAuth } from '../context/useAuth';
import SEOHead from '../components/SEOHead';
const QuickNotesPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main
      className="w-full max-w-7xl mx-auto flex flex-col flex-1 overflow-hidden"
      style={{ height: 'calc(100dvh - 64px)', minHeight: '520px' }}
    >
      <SEOHead title="Quick Notes | Utilities" description="Quick Notes for Utilities" noIndex={true} />
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden min-h-0">
        <QuickNotes token={token || ''} />
      </div>
    </main>
  );
};
export default QuickNotesPage;
