'use client';
import React from 'react';
import { BsPinFill } from 'react-icons/bs';
import { Note } from '../NotesTypes';
import styles from '../NotesList.module.scss';
import { NoteCard } from './NoteCard';
interface NotesListViewProps {
  pinnedNotes: Note[];
  unpinnedNotes: Note[];
  selectedNoteId: string | null;
  isTrash: boolean;
  onSelectNote: (note: Note) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDuplicateNote: (note: Note, e: React.MouseEvent) => void;
  onRestoreNote: (id: string, e: React.MouseEvent) => void;
  onOpenMoveModal: (note: Note) => void;
  onOpenDeleteModal: (note: Note) => void;
}
export const NotesListView: React.FC<NotesListViewProps> = ({
  pinnedNotes,
  unpinnedNotes,
  selectedNoteId,
  isTrash,
  onSelectNote,
  onTogglePin,
  onDuplicateNote,
  onRestoreNote,
  onOpenMoveModal,
  onOpenDeleteModal,
}) => {
  return (
    <>
      {pinnedNotes.length > 0 && (
        <div className={styles.pinnedSection}>
          <div className={styles.sectionTitleHeader}>
            <BsPinFill size={10} className={styles.pinIcon} />
            <span>Pinned</span>
          </div>
          <div className={styles.notesColumn}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                isTrash={isTrash}
                onSelectNote={onSelectNote}
                onTogglePin={onTogglePin}
                onDuplicateNote={onDuplicateNote}
                onRestoreNote={onRestoreNote}
                onOpenMoveModal={onOpenMoveModal}
                onOpenDeleteModal={onOpenDeleteModal}
              />
            ))}
          </div>
        </div>
      )}
      {unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className={styles.notesSectionHeader}>Notes</div>
          )}
          <div className={styles.notesColumn}>
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                isTrash={isTrash}
                onSelectNote={onSelectNote}
                onTogglePin={onTogglePin}
                onDuplicateNote={onDuplicateNote}
                onRestoreNote={onRestoreNote}
                onOpenMoveModal={onOpenMoveModal}
                onOpenDeleteModal={onOpenDeleteModal}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
