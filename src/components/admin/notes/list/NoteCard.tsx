'use client';
import React from 'react';
import { BsPinFill, BsLockFill } from 'react-icons/bs';
import {
  Note,
  formatNoteDate,
  extractSnippet,
  extractHashtags,
  deriveAutoTitleFromHtml,
} from '../NotesTypes';
import styles from '../NotesList.module.scss';
import { NoteCardActions } from './NoteCardActions';
interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  isTrash: boolean;
  onSelectNote: (note: Note) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDuplicateNote: (note: Note, e: React.MouseEvent) => void;
  onRestoreNote: (id: string, e: React.MouseEvent) => void;
  onOpenMoveModal: (note: Note) => void;
  onOpenDeleteModal: (note: Note) => void;
}
export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  isTrash,
  onSelectNote,
  onTogglePin,
  onDuplicateNote,
  onRestoreNote,
  onOpenMoveModal,
  onOpenDeleteModal,
}) => {
  const title = note.title?.trim() || deriveAutoTitleFromHtml(note.content) || 'New Note';
  const snippet = note.is_locked ? 'Locked Note' : extractSnippet(note.content);
  const dateFormatted = formatNoteDate(note.updated_at || note.created_at);
  const hashtags = extractHashtags(note.title + ' ' + note.content);
  const noteTags = Array.from(new Set([...(note.tags || []), ...hashtags])).slice(0, 3);
  const displayFolder = note.folder || 'Quick Notes';
  return (
    <div
      draggable={!note.is_trashed}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', note.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onSelectNote(note)}
      className={`${styles.noteCard} ${isSelected ? styles.noteCardSelected : ''}`}
    >
      <div className={styles.cardHeader}>
        <h3 className={`${styles.cardTitle} ${isSelected ? styles.cardTitleSelected : ''}`}>
          {title}
        </h3>
        <div className={styles.cardHeaderIcons}>
          {note.is_locked && (
            <span title="Locked Note" className={styles.lockIcon}>
              <BsLockFill size={14} />
            </span>
          )}
          {note.is_pinned && (
            <span title="Pinned Note" className={styles.pinIcon}>
              <BsPinFill size={14} />
            </span>
          )}
        </div>
      </div>
      <div className={styles.cardMeta}>
        <span className={`${styles.cardDate} ${isSelected ? styles.cardDateSelected : ''}`}>
          {dateFormatted}
        </span>
        <span className={styles.cardSnippet}>{snippet}</span>
      </div>
      <div className={styles.cardTagsRow}>
        {displayFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isTrash) onOpenMoveModal(note);
            }}
            className={styles.folderBadge}
            title="Click to move folder"
          >
            📁 {displayFolder}
          </button>
        )}
        {noteTags.map((t) => (
          <span key={t} className={styles.tagBadge}>
            #{t}
          </span>
        ))}
      </div>
      <NoteCardActions
        note={note}
        isTrash={isTrash}
        onTogglePin={onTogglePin}
        onDuplicateNote={onDuplicateNote}
        onRestoreNote={onRestoreNote}
        onOpenMoveModal={onOpenMoveModal}
        onOpenDeleteModal={onOpenDeleteModal}
      />
    </div>
  );
};
