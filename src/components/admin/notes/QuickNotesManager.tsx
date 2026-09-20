'use client';
import React, { useCallback, useEffect } from 'react';
import { useAuth } from '../../../context/useAuth';
import { getNotesStorageStatusAction } from '@/actions/notes';
import './quick-notes.css';
import styles from './QuickNotesManager.module.scss';
import { useNotesSync } from './manager/useNotesSync';
import { useNotesNavigation } from './manager/useNotesNavigation';
import { useNotesCreateActions } from './manager/useNotesCreateActions';
import { useNotesDeleteActions } from './manager/useNotesDeleteActions';
import { useNotesMutateActions } from './manager/useNotesMutateActions';
import { useNotesFolderLockActions } from './manager/useNotesFolderLockActions';
import { NotesSyncBanners } from './manager/NotesSyncBanners';
import { NotesManagerPanes } from './manager/NotesManagerPanes';
import { NotesManagerModals } from './manager/NotesManagerModals';
export const QuickNotesManager: React.FC<{ token: string }> = ({ token }) => {
  const { user } = useAuth();
  const userId = user?.id || 'default';
  const userEmail = user?.email || '';
  const {
    notes, setNotes, folders, setFolders, foldersKeyRef, loading,
    syncState, syncError, setReloadKey, saveError, setSaveError,
    unsyncedCount, setUnsyncedCount, isSaving, storageProvider,
    setStorageProvider, flushPendingSaves, queueNoteSync,
    savePendingRef, locallyDeletedRef, unconfirmedCreatesRef,
  } = useNotesSync({
    token, userId, userEmail,
    onSelectInitialNote: (reconciled) => {
      setSelectedNoteId((curr) => {
        const saved = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_last_note_id` : 'quick_notes_last_note_id');
        const target = curr || saved;
        if (target && reconciled.some((n) => n.id === target && !n.is_trashed)) return target;
        return reconciled.find((n) => !n.is_trashed)?.id || null;
      });
    },
  });
  const effectiveNoteId = notes.find((n) => !n.is_trashed)?.id || null;
  const {
    selectedNoteId, setSelectedNoteId, activeFolder, setActiveFolder,
    activeTag, setActiveTag, searchQuery, setSearchQuery,
    viewMode, setViewMode, sortOption, setSortOption,
    isSidebarOpen, setIsSidebarOpen, setMobileScreen,
    isMobile, effectiveMobileScreen,
  } = useNotesNavigation({ userId, hasSelectedNote: Boolean(effectiveNoteId) });
  const selectedNote = notes.find((n) => n.id === (selectedNoteId || effectiveNoteId)) || null;
  const { handleUpdateNote, handleTogglePin, handleMoveNoteToFolder } = useNotesMutateActions({
    notes, setNotes, selectedNoteId, queueNoteSync,
  });
  const { handleNewNote, handleDuplicateNote } = useNotesCreateActions({
    setNotes, selectedNote, setSelectedNoteId, setMobileScreen,
    activeFolder, activeTag, token, userId, userEmail, setSaveError,
    savePendingRef, unconfirmedCreatesRef, flushPendingSaves, queueNoteSync,
  });
  const { handleDeleteNote, handlePermanentDelete, handleRestoreNote, handleEmptyTrash } = useNotesDeleteActions({
    notes, setNotes, selectedNoteId, setSelectedNoteId, setMobileScreen,
    activeFolder, token, setSaveError, savePendingRef, locallyDeletedRef,
    setUnsyncedCount, flushPendingSaves, queueNoteSync,
  });
  const {
    unlockedNotes, isLockModalOpen, setIsLockModalOpen, isBackupModalOpen,
    setIsBackupModalOpen, isSecurityModalOpen, setIsSecurityModalOpen,
    handleCreateFolder, handleRenameFolder, handleDeleteFolder,
    handleSetLockPassword, handleRemoveLock, handleUnlockSession, handleRestoreSuccess,
  } = useNotesFolderLockActions({
    folders, setFolders, foldersKeyRef, activeFolder, setActiveFolder,
    setMobileScreen, isMobile, notes, setNotes, queueNoteSync,
    selectedNoteId, setSelectedNoteId, handleUpdateNote,
  });
  const handleSelectNote = useCallback((note: { id: string }) => {
    if (savePendingRef.current.size > 0) void flushPendingSaves();
    setSelectedNoteId(note.id);
    setMobileScreen('editor');
  }, [flushPendingSaves, savePendingRef, setSelectedNoteId, setMobileScreen]);
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && (e.key === 'n' || e.key === 'N')) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          handleNewNote();
        }
      } else if (isMeta && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNewNote, setIsSidebarOpen]);
  const handleOpenSecurityModal = useCallback(() => {
    setIsSecurityModalOpen(true);
    if (!storageProvider && token) {
      getNotesStorageStatusAction().then((d) => {
        if (d?.storage_provider) setStorageProvider(d.storage_provider as 'vercel_blob' | 'database_fallback');
      }).catch(() => {});
    }
  }, [storageProvider, token, setStorageProvider, setIsSecurityModalOpen]);
  return (
    <div className={`${styles.container} quick-notes-theme`}>
      <NotesSyncBanners
        loading={loading} notesCount={notes.length} syncState={syncState} syncError={syncError}
        saveError={saveError} unsyncedCount={unsyncedCount} isSaving={isSaving}
        onDismissSaveError={() => setSaveError('')} onFlushPendingSaves={() => void flushPendingSaves()}
        onRetrySync={() => setReloadKey((n) => n + 1)}
      />
      <NotesManagerPanes
        notes={notes} selectedNote={selectedNote} selectedNoteId={selectedNoteId}
        setSelectedNoteId={setSelectedNoteId} activeFolder={activeFolder} setActiveFolder={setActiveFolder}
        activeTag={activeTag} setActiveTag={setActiveTag} searchQuery={searchQuery}
        setSearchQuery={setSearchQuery} viewMode={viewMode} setViewMode={setViewMode}
        sortOption={sortOption} setSortOption={setSortOption} folders={folders}
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isMobile={isMobile}
        effectiveMobileScreen={effectiveMobileScreen} setMobileScreen={setMobileScreen}
        isSaving={isSaving} unlockedNotes={unlockedNotes} onSelectNote={handleSelectNote}
        onNewNote={handleNewNote} onDuplicateNote={handleDuplicateNote} onUpdateNote={handleUpdateNote}
        onTogglePin={handleTogglePin} onDeleteNote={handleDeleteNote} onPermanentDelete={handlePermanentDelete}
        onRestoreNote={handleRestoreNote} onEmptyTrash={handleEmptyTrash} onMoveNoteToFolder={handleMoveNoteToFolder}
        onCreateFolder={handleCreateFolder} onRenameFolder={handleRenameFolder} onDeleteFolder={handleDeleteFolder}
        onOpenLockModal={() => setIsLockModalOpen(true)} onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenSecurityModal={handleOpenSecurityModal} onUnlockSession={handleUnlockSession}
      />
      <NotesManagerModals
        selectedNote={selectedNote} isLockModalOpen={isLockModalOpen}
        isBackupModalOpen={isBackupModalOpen} isSecurityModalOpen={isSecurityModalOpen}
        storageProvider={storageProvider} notes={notes} folders={folders} token={token}
        userId={userId} userEmail={userEmail} onCloseLockModal={() => setIsLockModalOpen(false)}
        onCloseBackupModal={() => setIsBackupModalOpen(false)} onCloseSecurityModal={() => setIsSecurityModalOpen(false)}
        onSetLockPassword={handleSetLockPassword} onRemoveLock={handleRemoveLock}
        onUnlockSuccess={handleUnlockSession} onRestoreSuccess={handleRestoreSuccess}
      />
    </div>
  );
};
export default QuickNotesManager;
