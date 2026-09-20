'use client';
import React from 'react';
import { FiShield } from 'react-icons/fi';
import { SortOption } from '../NotesTypes';
import styles from '../NotesList.module.scss';
interface NotesListSubBarProps {
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  isTrash: boolean;
  count: number;
  onEmptyTrash: () => void;
  onOpenSecurityModal?: () => void;
}
export const NotesListSubBar: React.FC<NotesListSubBarProps> = ({
  sortOption,
  onSortChange,
  isTrash,
  count,
  onEmptyTrash,
  onOpenSecurityModal,
}) => {
  return (
    <div className={styles.subBar}>
      <div className={styles.sortWrapper}>
        <span>Sort by:</span>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className={styles.sortSelect}
        >
          <option value="updated_desc">Date Edited</option>
          <option value="created_desc">Date Created</option>
          <option value="title_asc">Title</option>
        </select>
      </div>
      {isTrash && count > 0 && (
        <button onClick={onEmptyTrash} className={styles.emptyTrashBtn}>
          Empty Trash
        </button>
      )}
      {!isTrash && onOpenSecurityModal && (
        <button
          type="button"
          onClick={onOpenSecurityModal}
          className={styles.securityBtn}
          title="End-to-End Encrypted with AES-256-GCM: Zero-Knowledge Privacy"
        >
          <FiShield size={12} />
          <span>E2E Encrypted</span>
        </button>
      )}
    </div>
  );
};
