'use client';
import React from 'react';
import { Note } from '../NotesTypes';
import styles from '../NotesList.module.scss';
import { NoteGalleryCard } from './NoteGalleryCard';
interface NotesGalleryViewProps {
  notes: Note[];
  selectedNoteId: string | null;
  isTrash: boolean;
  onSelectNote: (note: Note) => void;
  onRestoreNote: (id: string, e: React.MouseEvent) => void;
  onOpenMoveModal: (note: Note) => void;
  onOpenDeleteModal: (note: Note) => void;
}
export const NotesGalleryView: React.FC<NotesGalleryViewProps> = ({
  notes,
  selectedNoteId,
  isTrash,
  onSelectNote,
  onRestoreNote,
  onOpenMoveModal,
  onOpenDeleteModal,
}) => {
  return (
    <div className={styles.galleryGrid}>
      {notes.map((note) => (
        <NoteGalleryCard
          key={note.id}
          note={note}
          isSelected={note.id === selectedNoteId}
          isTrash={isTrash}
          onSelectNote={onSelectNote}
          onRestoreNote={onRestoreNote}
          onOpenMoveModal={onOpenMoveModal}
          onOpenDeleteModal={onOpenDeleteModal}
        />
      ))}
    </div>
  );
};
