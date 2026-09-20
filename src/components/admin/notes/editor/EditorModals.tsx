import React from 'react';
import { Note } from '../NotesTypes';
import { MoveNoteModal } from '../MoveNoteModal';
import { EditorDeleteModal } from './EditorDeleteModal';
interface EditorModalsProps {
  note: Note;
  folders: string[];
  isTrash: boolean;
  showDeleteConfirm: boolean;
  showMoveModal: boolean;
  onCloseDeleteConfirm: () => void;
  onCloseMoveModal: () => void;
  onPermanentDelete: () => void;
  onDeleteNote: () => void;
  onUpdateNote: (updated: Partial<Note>) => void;
  onCreateFolder?: (name: string) => void;
}
export const EditorModals: React.FC<EditorModalsProps> = ({
  note,
  folders,
  isTrash,
  showDeleteConfirm,
  showMoveModal,
  onCloseDeleteConfirm,
  onCloseMoveModal,
  onPermanentDelete,
  onDeleteNote,
  onUpdateNote,
  onCreateFolder,
}) => {
  return (
    <>
      <EditorDeleteModal
        isOpen={showDeleteConfirm}
        isTrash={Boolean(isTrash || note.is_trashed)}
        noteTitle={note.title || ''}
        onClose={onCloseDeleteConfirm}
        onConfirm={() => {
          if (isTrash || note.is_trashed) {
            onPermanentDelete();
          } else {
            onDeleteNote();
          }
        }}
      />
      <MoveNoteModal
        isOpen={showMoveModal}
        note={note}
        folders={folders}
        onClose={onCloseMoveModal}
        onMove={(_id, targetFolder) => onUpdateNote({ folder: targetFolder })}
        onCreateFolder={(name) => {
          if (onCreateFolder) onCreateFolder(name);
          onUpdateNote({ folder: name });
        }}
      />
    </>
  );
};
