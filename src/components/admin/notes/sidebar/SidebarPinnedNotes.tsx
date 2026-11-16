'use client';
import React, { useState } from 'react';
import { BsPinFill } from 'react-icons/bs';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { Note, deriveAutoTitleFromHtml } from '../NotesTypes';
import styles from '../NotesSidebar.module.scss';

interface SidebarPinnedNotesProps {
  notes: Note[];
  selectedNoteId?: string | null;
  onSelectNote?: (note: Note) => void;
}

export const SidebarPinnedNotes: React.FC<SidebarPinnedNotesProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
}) => {
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const pinnedNotes = notes.filter((n) => !n.is_trashed && n.is_pinned);

  if (pinnedNotes.length === 0) return null;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <button
          onClick={() => setPinnedCollapsed(!pinnedCollapsed)}
          className={styles.sectionToggle}
        >
          {pinnedCollapsed ? <FiChevronRight size={12} /> : <FiChevronDown size={12} />}
          <span>Pinned Notes</span>
        </button>
        <span className={styles.tagCountBadge}>{pinnedNotes.length}</span>
      </div>
      {!pinnedCollapsed && (
        <div className={styles.folderSection}>
          {pinnedNotes.map((note) => {
            const title = note.title?.trim() || deriveAutoTitleFromHtml(note.content) || 'Untitled Note';
            const isCurrent = note.id === selectedNoteId;
            return (
              <button
                key={note.id}
                onClick={() => onSelectNote && onSelectNote(note)}
                className={`${styles.navItem} ${isCurrent ? styles.navItemActive : ''}`}
                title={title}
              >
                <span className={styles.navLeft}>
                  <BsPinFill size={14} className={styles.primaryIcon} />
                  <span className={styles.folderNameText}>{title}</span>
                </span>
                {note.is_locked && <span className={styles.tagCountBadge}>🔒</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
