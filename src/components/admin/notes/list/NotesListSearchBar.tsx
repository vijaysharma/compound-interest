'use client';
import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styles from '../NotesList.module.scss';
interface NotesListSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}
export const NotesListSearchBar: React.FC<NotesListSearchBarProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className={styles.searchBox}>
      <FiSearch className={styles.searchIcon} />
      <input
        type="text"
        placeholder="Search all notes, tags, checklists..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.searchInput}
      />
      {searchQuery && (
        <button onClick={() => onSearchChange('')} className={styles.clearBtn}>
          <FiX size={14} />
        </button>
      )}
    </div>
  );
};
