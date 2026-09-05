import React from 'react';
import { QuickNotesManager } from './notes/QuickNotesManager';
const QuickNotes: React.FC<{ token: string }> = ({ token }) => {
  return <QuickNotesManager token={token} />;
};
export default QuickNotes;
