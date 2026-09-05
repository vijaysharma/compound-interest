import React from 'react';
import QuickNotes from '../components/admin/QuickNotes';
import { useAuth } from '../context/useAuth';
import SEOHead from '../components/SEOHead';
const QuickNotesPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className="w-full max-w-7xl mx-auto flex flex-col">
      <SEOHead title="Quick Notes | Utilities" description="Quick Notes for Utilities" noIndex={true} />
      <div className="flex-1 w-full h-[calc(100dvh-70px)] sm:h-[calc(100dvh-80px)] min-h-[580px] sm:min-h-[640px] md:min-h-[720px] flex flex-col">
        <QuickNotes token={token || ''} />
      </div>
    </main>
  );
};
export default QuickNotesPage;
