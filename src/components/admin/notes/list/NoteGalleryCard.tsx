'use client';
import React from 'react';
import { FiFolder, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { BsPinFill } from 'react-icons/bs';
import {
  Note,
  formatNoteDate,
  extractSnippet,
  deriveAutoTitleFromHtml,
} from '../NotesTypes';
import styles from '../NotesList.module.scss';
interface NoteGalleryCardProps {
  note: Note;
  isSelected: boolean;
  isTrash: boolean;
  onSelectNote: (note: Note) => void;
  onRestoreNote: (id: string, e: React.MouseEvent) => void;
  onOpenMoveModal: (note: Note) => void;
  onOpenDeleteModal: (note: Note) => void;
}
export const NoteGalleryCard: React.FC<NoteGalleryCardProps> = ({
  note,
  isSelected,
  isTrash,
  onSelectNote,
  onRestoreNote,
  onOpenMoveModal,
  onOpenDeleteModal,
}) => {
  const title = note.title?.trim() || deriveAutoTitleFromHtml(note.content) || 'New Note';
  const snippet = note.is_locked ? 'Locked Note' : extractSnippet(note.content);
  return (
    <div
      draggable={!note.is_trashed}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', note.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onSelectNote(note)}
      className={`${styles.galleryCard} ${isSelected ? styles.gallerySelected : ''}`}
    >
      <div>
        <div className={styles.galleryCardHeader}>
          <h4
            className={`${styles.cardTitle} ${styles.galleryCardTitle} ${isSelected ? styles.cardTitleSelected : ''}`}
          >
            {title}
          </h4>
          <div className={styles.galleryCardHeaderActions}>
            {note.is_pinned && <BsPinFill size={12} className={styles.pinIcon} />}
            {isTrash ? (
              <div className={styles.trashActions}>
                <button
                  onClick={(e) => onRestoreNote(note.id, e)}
                  className={`${styles.floatingBtn} ${styles.success}`}
                  title="Restore Note"
                >
                  <FiRotateCcw size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeleteModal(note);
                  }}
                  className={`${styles.floatingBtn} ${styles.danger}`}
                  title="Delete Permanently"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDeleteModal(note);
                }}
                className={`${styles.floatingBtn} ${styles.danger}`}
                title="Delete note"
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <p className={styles.gallerySnippet}>{snippet}</p>
      </div>
      <div className={styles.galleryFooter}>
        <span className={styles.galleryDate}>
          {formatNoteDate(note.updated_at || note.created_at)}
        </span>
        {!isTrash && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMoveModal(note);
            }}
            className={styles.galleryFolderBtn}
            title="Move to Folder"
          >
            <FiFolder size={10} />
            <span className={styles.galleryFolderText}>
              {note.folder || 'Quick Notes'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
