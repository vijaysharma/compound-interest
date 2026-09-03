import React from 'react';
import QuickNotes from '../../components/admin/QuickNotes';
import { useAuth } from '../../context/useAuth';
import SEOHead from '../../components/SEOHead';

const QuickNotesPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-8">
      <SEOHead title="Quick Notes | Admin" description="Quick Notes for Admin" noIndex={true} />
      <h1 className="text-3xl font-bold mb-6 text-base-content text-center">Quick Notes</h1>
      <QuickNotes token={token || ''} />
    </main>
  );
};

export default QuickNotesPage;
