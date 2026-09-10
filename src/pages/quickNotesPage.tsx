import React from 'react';
import QuickNotes from '../components/admin/QuickNotes';
import { useAuth } from '../context/useAuth';
import SEOHead from '../components/SEOHead';
import styles from './admin/AdminPage.module.scss';
const QuickNotesPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className={styles.notesContainer}>
      <SEOHead title="Quick Notes | Utilities" description="Quick Notes for Utilities" noIndex={true} />
      <div className={styles.notesInner}>
        <QuickNotes token={token || ''} />
      </div>
    </main>
  );
};
export default QuickNotesPage;
