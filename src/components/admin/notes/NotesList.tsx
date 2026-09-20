'use client';
import React, { useState } from 'react';
import { Note } from './NotesTypes';
import { MoveNoteModal } from './MoveNoteModal';
import styles from './NotesList.module.scss';
import { NotesListProps } from './list/types';
import { useNotesListFilter } from './list/useNotesListFilter';
import { NotesListHeader } from './list/NotesListHeader';
import { NotesListEmpty } from './list/NotesListEmpty';
import { NotesListView } from './list/NotesListView';
import { NotesGalleryView } from './list/NotesGalleryView';
import { NoteDeleteModal } from './list/NoteDeleteModal';
export const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  activeFolder,
  activeTag,
  searchQuery,
  viewMode,
  sortOption,
  folders,
  onSelectNote,
  onNewNote,
  onSearchChange,
  onViewModeChange,
  onSortChange,
  onTogglePin,
  onDeleteNote,
  onPermanentDelete,
  onDuplicateNote,
  onRestoreNote,
  onEmptyTrash,
  onMoveNoteToFolder,
  onCreateFolder,
  onBackToFolders,
  onToggleSidebar,
  isSidebarOpen,
  onOpenBackupModal,
  onOpenSecurityModal,
  isMobileScreen,
}) => {
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [noteToMove, setNoteToMove] = useState<Note | null>(null);
  const {
    isTrash,
    filteredNotes,
    sortedNotes,
    pinnedNotes,
    unpinnedNotes,
  } = useNotesListFilter({
    notes,
    activeFolder,
    activeTag,
    searchQuery,
    sortOption,
  });
  const handleConfirmDelete = () => {
    if (!noteToDelete) return;
    if (isTrash && onPermanentDelete) {
      onPermanentDelete(noteToDelete.id);
    } else {
      onDeleteNote(noteToDelete.id);
    }
    setNoteToDelete(null);
  };
  return (
    <div
      className={`${styles.container} ${isMobileScreen ? styles.mobile : styles.desktop}`}
      aria-label="Notes List Column"
    >
      <NotesListHeader
        activeFolder={activeFolder}
        activeTag={activeTag}
        count={filteredNotes.length}
        searchQuery={searchQuery}
        viewMode={viewMode}
        sortOption={sortOption}
        isTrash={isTrash}
        isSidebarOpen={isSidebarOpen}
        isMobileScreen={isMobileScreen}
        onSearchChange={onSearchChange}
        onViewModeChange={onViewModeChange}
        onSortChange={onSortChange}
        onNewNote={onNewNote}
        onEmptyTrash={onEmptyTrash}
        onBackToFolders={onBackToFolders}
        onToggleSidebar={onToggleSidebar}
        onOpenBackupModal={onOpenBackupModal}
        onOpenSecurityModal={onOpenSecurityModal}
      />
      <div className={`${styles.listContent} qn-scrollbar`}>
        {filteredNotes.length === 0 ? (
          <NotesListEmpty
            searchQuery={searchQuery}
            isTrash={isTrash}
            onNewNote={onNewNote}
          />
        ) : viewMode === 'gallery' ? (
          <NotesGalleryView
            notes={sortedNotes}
            selectedNoteId={selectedNoteId}
            isTrash={isTrash}
            onSelectNote={onSelectNote}
            onRestoreNote={onRestoreNote}
            onOpenMoveModal={setNoteToMove}
            onOpenDeleteModal={setNoteToDelete}
          />
        ) : (
          <NotesListView
            pinnedNotes={pinnedNotes}
            unpinnedNotes={unpinnedNotes}
            selectedNoteId={selectedNoteId}
            isTrash={isTrash}
            onSelectNote={onSelectNote}
            onTogglePin={onTogglePin}
            onDuplicateNote={onDuplicateNote}
            onRestoreNote={onRestoreNote}
            onOpenMoveModal={setNoteToMove}
            onOpenDeleteModal={setNoteToDelete}
          />
        )}
      </div>
      <NoteDeleteModal
        note={noteToDelete}
        isTrash={isTrash}
        onClose={() => setNoteToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />
      <MoveNoteModal
        isOpen={Boolean(noteToMove)}
        note={noteToMove}
        folders={folders}
        onClose={() => setNoteToMove(null)}
        onMove={(id, targetFolder) => onMoveNoteToFolder(id, targetFolder)}
        onCreateFolder={onCreateFolder}
      />
    </div>
  );
};
