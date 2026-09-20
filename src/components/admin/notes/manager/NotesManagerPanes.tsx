'use client';
import React from 'react';
import { NotesSidebar } from '../NotesSidebar';
import { NotesList } from '../NotesList';
import { NotesEditor } from '../NotesEditor';
import { Note, ViewMode, SortOption, SYSTEM_FOLDERS, extractHashtags } from '../NotesTypes';
import styles from '../QuickNotesManager.module.scss';
interface NotesManagerPanesProps {
  notes: Note[];
  selectedNote: Note | null;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  activeFolder: string;
  setActiveFolder: (f: string) => void;
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;
  folders: string[];
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  effectiveMobileScreen: 'folders' | 'list' | 'editor';
  setMobileScreen: (s: 'folders' | 'list' | 'editor') => void;
  isSaving: boolean;
  unlockedNotes: Set<string>;
  onSelectNote: (note: { id: string }) => void;
  onNewNote: () => void;
  onDuplicateNote: () => void;
  onUpdateNote: (fields: Partial<Note>) => void;
  onTogglePin: (id?: string) => void;
  onDeleteNote: (id?: string) => void;
  onPermanentDelete: (id?: string) => void;
  onRestoreNote: (id?: string) => void;
  onEmptyTrash: () => void;
  onMoveNoteToFolder: (noteId: string, folder: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onDeleteFolder: (name: string) => void;
  onOpenLockModal: () => void;
  onOpenBackupModal: () => void;
  onOpenSecurityModal: () => void;
  onUnlockSession: () => void;
}
export const NotesManagerPanes: React.FC<NotesManagerPanesProps> = ({
  notes, selectedNote, selectedNoteId, setSelectedNoteId, activeFolder, setActiveFolder,
  activeTag, setActiveTag, searchQuery, setSearchQuery, viewMode, setViewMode,
  sortOption, setSortOption, folders, isSidebarOpen, setIsSidebarOpen, isMobile,
  effectiveMobileScreen, setMobileScreen, isSaving, unlockedNotes, onSelectNote,
  onNewNote, onDuplicateNote, onUpdateNote, onTogglePin, onDeleteNote,
  onPermanentDelete, onRestoreNote, onEmptyTrash, onMoveNoteToFolder,
  onCreateFolder, onRenameFolder, onDeleteFolder, onOpenLockModal,
  onOpenBackupModal, onOpenSecurityModal, onUnlockSession,
}) => {
  const trashedCount = notes.filter((n) => n.is_trashed).length;
  return (
    <>
      <div className={`${styles.sidebarPane} ${isMobile ? (effectiveMobileScreen === 'folders' ? styles.mobileVisible : styles.hidden) : (isSidebarOpen ? styles.desktopVisible : styles.hidden)}`}>
        <NotesSidebar
          activeFolder={activeFolder} activeTag={activeTag} folders={folders} notes={notes}
          trashedCount={trashedCount}
          onSelectFolder={(f) => {
            setActiveFolder(f); setActiveTag(null);
            if (isMobile) setMobileScreen('list');
            else {
              const fn = notes.filter((n) => f === SYSTEM_FOLDERS.ALL ? !n.is_trashed : f === SYSTEM_FOLDERS.TRASH ? n.is_trashed : f === SYSTEM_FOLDERS.PINNED ? n.is_pinned && !n.is_trashed : n.folder === f && !n.is_trashed);
              if (!fn.some((n) => n.id === selectedNoteId)) setSelectedNoteId(fn[0]?.id || null);
            }
          }}
          onSelectTag={(t) => {
            setActiveTag(t);
            if (isMobile) setMobileScreen('list');
            else if (t) {
              const tn = notes.filter((n) => !n.is_trashed && new Set([...(n.tags || []), ...extractHashtags(n.title + ' ' + n.content)].map((x) => x.toLowerCase())).has(t.toLowerCase()));
              if (!tn.some((n) => n.id === selectedNoteId)) setSelectedNoteId(tn[0]?.id || null);
            }
          }}
          onCreateFolder={onCreateFolder} onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder} onMoveNoteToFolder={onMoveNoteToFolder}
          isOpen={isMobile ? effectiveMobileScreen === 'folders' : isSidebarOpen}
          onClose={() => isMobile ? setMobileScreen('list') : setIsSidebarOpen(false)}
          onCloseMobile={() => setMobileScreen('list')} onOpenBackupModal={onOpenBackupModal}
          onOpenSecurityModal={onOpenSecurityModal} onNewNote={onNewNote}
          isMobileScreen={isMobile && effectiveMobileScreen === 'folders'}
        />
      </div>
      <div className={`${styles.listPane} ${isMobile && effectiveMobileScreen === 'list' ? styles.mobileVisible : ''}`}>
        <NotesList
          notes={notes} selectedNoteId={selectedNoteId} activeFolder={activeFolder} activeTag={activeTag}
          searchQuery={searchQuery} viewMode={viewMode} sortOption={sortOption} folders={folders}
          onSelectNote={onSelectNote} onNewNote={onNewNote} onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode} onSortChange={setSortOption} onTogglePin={(id) => onTogglePin(id)}
          onDeleteNote={(id) => onDeleteNote(id)} onPermanentDelete={onPermanentDelete} onDuplicateNote={onDuplicateNote}
          onRestoreNote={(id) => onRestoreNote(id)} onEmptyTrash={onEmptyTrash} onMoveNoteToFolder={onMoveNoteToFolder}
          onCreateFolder={onCreateFolder} onBackToFolders={() => setMobileScreen('folders')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen}
          onOpenBackupModal={onOpenBackupModal} onOpenSecurityModal={onOpenSecurityModal}
          isMobileScreen={isMobile && effectiveMobileScreen === 'list'}
        />
      </div>
      <div className={`${styles.editorPane} ${isMobile && effectiveMobileScreen === 'editor' ? styles.mobileVisible : ''}`}>
        <NotesEditor
          note={selectedNote} folders={folders} isSaving={isSaving} onUpdateNote={onUpdateNote}
          onTogglePin={() => onTogglePin()} onDeleteNote={() => onDeleteNote()}
          onRestoreNote={() => onRestoreNote()} onPermanentDelete={() => onPermanentDelete()}
          onNewNote={onNewNote} onOpenLockModal={onOpenLockModal} onDuplicateNote={onDuplicateNote}
          isUnlockedInSession={Boolean(selectedNoteId && unlockedNotes.has(selectedNoteId))}
          onUnlockSession={onUnlockSession} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen} onBackMobile={() => setMobileScreen('list')}
          onOpenBackupModal={onOpenBackupModal} onOpenSecurityModal={onOpenSecurityModal}
          onCreateFolder={onCreateFolder} folderTitle={activeFolder === SYSTEM_FOLDERS.ALL ? 'All Notes' : activeFolder}
          isMobileScreen={isMobile && effectiveMobileScreen === 'editor'}
        />
      </div>
    </>
  );
};
