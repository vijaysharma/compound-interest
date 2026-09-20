'use client';
import React from 'react';
import { FiEdit3 } from 'react-icons/fi';
import styles from '../NotesList.module.scss';
import modalStyles from '../NotesModal.module.scss';
interface NotesListEmptyProps {
  searchQuery: string;
  isTrash: boolean;
  onNewNote: () => void;
}
export const NotesListEmpty: React.FC<NotesListEmptyProps> = ({
  searchQuery,
  isTrash,
  onNewNote,
}) => {
  return (
    <div className={styles.emptyState}>
      <FiEdit3 size={32} className={styles.emptyStateIcon} />
      <p className={styles.emptyStateText}>
        {searchQuery
          ? 'No matching notes found'
          : isTrash
            ? 'Trash is empty'
            : 'No notes in this folder'}
      </p>
      {!isTrash && !searchQuery && (
        <button onClick={onNewNote} className={modalStyles.btnPrimary}>
          Create a Note
        </button>
      )}
    </div>
  );
};
