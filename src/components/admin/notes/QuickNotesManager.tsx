'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { getNotesStorageStatusAction } from '@/actions/notes';
import './quick-notes.css';
import styles from './QuickNotesManager.module.scss';
import { Note, SYSTEM_FOLDERS } from './NotesTypes';
import { useNotesSync } from './manager/useNotesSync';
import { useNotesNavigation } from './manager/useNotesNavigation';
import { useNotesCreateActions } from './manager/useNotesCreateActions';
import { useNotesDeleteActions } from './manager/useNotesDeleteActions';
import { useNotesMutateActions } from './manager/useNotesMutateActions';
import { useNotesFolderLockActions } from './manager/useNotesFolderLockActions';
import { NotesSyncBanners } from './manager/NotesSyncBanners';
import { NotesManagerPanes } from './manager/NotesManagerPanes';
import { NotesManagerModals } from './manager/NotesManagerModals';
import { removeLocalDraft } from './manager/notesDraftStorage';
export const QuickNotesManager: React.FC<{ token: string }> = ({ token }) => {
  const { user } = useAuth();
  const userId = user?.id || 'default';
  const userEmail = user?.email || '';
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quick_notes_autosave');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const handleToggleAutoSave = useCallback(() => {
    setAutoSaveEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('quick_notes_autosave', String(next));
      }
      return next;
    });
  }, []);
  const {
    selectedNoteId, setSelectedNoteId, activeFolder, setActiveFolder,
    activeTag, setActiveTag, searchQuery, setSearchQuery,
    viewMode, setViewMode, sortOption, setSortOption,
    isSidebarOpen, setIsSidebarOpen, setMobileScreen,
    isMobile, effectiveMobileScreen,
  } = useNotesNavigation({
    userId,
    hasSelectedNote: false,
  });
  const handleSelectInitialNote = useCallback((reconciled: Note[]) => {
    setSelectedNoteId((curr) => {
      const saved = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_last_note_id` : 'quick_notes_last_note_id');
      const target = curr || saved;
      if (target && reconciled.some((n) => n.id === target)) return target;
      return reconciled.find((n) => !n.is_trashed)?.id || null;
    });
  }, [userId, setSelectedNoteId]);
  const {
    notes, setNotes, folders, setFolders, foldersKeyRef, loading,
    syncState, syncError, setReloadKey, saveError, setSaveError,
    unsyncedCount, setUnsyncedCount, isSaving, storageProvider,
    setStorageProvider, flushPendingSaves, queueNoteSync,
    savePendingRef, locallyDeletedRef, unconfirmedCreatesRef,
  } = useNotesSync({
    token, userId, userEmail, autoSaveEnabled,
    onSelectInitialNote: handleSelectInitialNote,
  });
  const selectedNote =
    (selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : null) ||
    (activeFolder === SYSTEM_FOLDERS.TRASH ? null : notes.find((n) => !n.is_trashed)) ||
    null;
  const cleanNotesRef = useRef<Map<string, Note>>(new Map());
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const saveSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleManualSave = useCallback(async () => {
    if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
    await flushPendingSaves();
    if (selectedNoteId) {
      cleanNotesRef.current.delete(selectedNoteId);
    }
    setSaveSuccessMessage('Note saved successfully');
    saveSuccessTimerRef.current = setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3000);
  }, [flushPendingSaves, selectedNoteId]);
  useEffect(() => {
    return () => {
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
    };
  }, []);
  const { handleUpdateNote, handleTogglePin, handleMoveNoteToFolder } = useNotesMutateActions({
    notes, setNotes, selectedNoteId, queueNoteSync, userId,
  });
  const handleUpdateNoteWithSnapshot = useCallback(
    (updatedFields: Partial<Note>, targetId?: string) => {
      const id = targetId || selectedNoteId;
      if (id && !cleanNotesRef.current.has(id)) {
        const existing = notes.find((n) => n.id === id);
        if (existing) {
          cleanNotesRef.current.set(id, { ...existing });
        }
      }
      handleUpdateNote(updatedFields, targetId);
    },
    [handleUpdateNote, notes, selectedNoteId]
  );
  const { handleNewNote, handleDuplicateNote } = useNotesCreateActions({
    setNotes, selectedNote, setSelectedNoteId, setMobileScreen,
    activeFolder, activeTag, token, userId, userEmail, setSaveError,
    savePendingRef, unconfirmedCreatesRef, flushPendingSaves, queueNoteSync,
  });
  const { handleDeleteNote, handlePermanentDelete, handleRestoreNote, handleEmptyTrash } = useNotesDeleteActions({
    notes, setNotes, selectedNoteId, setSelectedNoteId, setMobileScreen,
    activeFolder, token, setSaveError, savePendingRef, locallyDeletedRef,
    setUnsyncedCount, flushPendingSaves, queueNoteSync, userId,
  });
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
  const requestNavigation = useCallback(
    (action: () => void) => {
      if (!autoSaveEnabled && selectedNoteId && savePendingRef.current.has(selectedNoteId)) {
        setPendingNav(() => action);
        setIsUnsavedModalOpen(true);
        return;
      }
      if (savePendingRef.current.size > 0 && autoSaveEnabled) {
        void flushPendingSaves();
      }
      action();
    },
    [autoSaveEnabled, selectedNoteId, savePendingRef, flushPendingSaves]
  );
  const handleCloseUnsavedModal = useCallback(() => {
    setIsUnsavedModalOpen(false);
    setPendingNav(null);
  }, []);
  const handleDiscardUnsavedChanges = useCallback(() => {
    if (selectedNoteId) {
      savePendingRef.current.delete(selectedNoteId);
      removeLocalDraft(userId, selectedNoteId);
      if (unconfirmedCreatesRef.current.has(selectedNoteId)) {
        unconfirmedCreatesRef.current.delete(selectedNoteId);
        setNotes((prev) => prev.filter((n) => n.id !== selectedNoteId));
      } else {
        const clean = cleanNotesRef.current.get(selectedNoteId);
        if (clean) {
          setNotes((prev) => prev.map((n) => (n.id === selectedNoteId ? clean : n)));
          cleanNotesRef.current.delete(selectedNoteId);
        } else {
          setReloadKey((n) => n + 1);
        }
      }
      setUnsyncedCount(savePendingRef.current.size);
    }
    const nextAction = pendingNav;
    setIsUnsavedModalOpen(false);
    setPendingNav(null);
    if (nextAction) nextAction();
  }, [selectedNoteId, savePendingRef, userId, unconfirmedCreatesRef, setNotes, cleanNotesRef, setReloadKey, setUnsyncedCount, pendingNav]);
  const handleSaveAndProceedUnsavedChanges = useCallback(async () => {
    await flushPendingSaves();
    if (selectedNoteId) {
      cleanNotesRef.current.delete(selectedNoteId);
    }
    setSaveSuccessMessage('Note saved successfully');
    if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
    saveSuccessTimerRef.current = setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3000);
    const nextAction = pendingNav;
    setIsUnsavedModalOpen(false);
    setPendingNav(null);
    if (nextAction) nextAction();
  }, [flushPendingSaves, selectedNoteId, pendingNav]);
  const handleSelectNote = useCallback((note: { id: string }) => {
    if (note.id === selectedNoteId) {
      setMobileScreen('editor');
      return;
    }
    requestNavigation(() => {
      setSelectedNoteId(note.id);
      setMobileScreen('editor');
    });
  }, [selectedNoteId, requestNavigation, setSelectedNoteId, setMobileScreen]);
  const handleNewNoteRequested = useCallback(() => {
    requestNavigation(() => {
      void handleNewNote();
    });
  }, [requestNavigation, handleNewNote]);
  const handleSelectFolder = useCallback((folder: string) => {
    requestNavigation(() => {
      setActiveFolder(folder);
      setActiveTag(null);
      if (isMobile) setMobileScreen('list');
      else {
        const fn = notes.filter((n) =>
          folder === SYSTEM_FOLDERS.ALL
            ? !n.is_trashed
            : folder === SYSTEM_FOLDERS.TRASH
            ? n.is_trashed
            : folder === SYSTEM_FOLDERS.PINNED
            ? n.is_pinned && !n.is_trashed
            : n.folder === folder && !n.is_trashed
        );
        if (!fn.some((n) => n.id === selectedNoteId)) setSelectedNoteId(fn[0]?.id || null);
      }
    });
  }, [requestNavigation, setActiveFolder, setActiveTag, isMobile, setMobileScreen, notes, selectedNoteId, setSelectedNoteId]);
  const handleSelectTag = useCallback((tag: string | null) => {
    requestNavigation(() => {
      setActiveTag(tag);
      if (isMobile) setMobileScreen('list');
      else if (tag) {
        const tn = notes.filter((n) => !n.is_trashed && (n.tags || []).some((x) => x.toLowerCase() === tag.toLowerCase()));
        if (!tn.some((n) => n.id === selectedNoteId)) setSelectedNoteId(tn[0]?.id || null);
      }
    });
  }, [requestNavigation, setActiveTag, isMobile, setMobileScreen, notes, selectedNoteId, setSelectedNoteId]);
  const handleBackMobile = useCallback(() => {
    requestNavigation(() => {
      setMobileScreen('list');
    });
  }, [requestNavigation, setMobileScreen]);
  useEffect(() => {
    if (!activeTag) return;
    const hasTag = notes.some((n) => !n.is_trashed && (n.tags || []).some((t) => t.toLowerCase() === activeTag.toLowerCase()));
    if (!hasTag) setActiveTag(null);
  }, [notes, activeTag, setActiveTag]);
  const {
    unlockedNotes, isLockModalOpen, setIsLockModalOpen, isBackupModalOpen,
    setIsBackupModalOpen, isSecurityModalOpen, setIsSecurityModalOpen,
    handleCreateFolder, handleRenameFolder, handleDeleteFolder,
    handleSetLockPassword, handleRemoveLock, handleUnlockSession, handleRestoreSuccess,
  } = useNotesFolderLockActions({
    folders, setFolders, foldersKeyRef, activeFolder, setActiveFolder,
    setMobileScreen, isMobile, notes, setNotes, queueNoteSync,
    selectedNoteId, setSelectedNoteId, handleUpdateNote: handleUpdateNoteWithSnapshot,
  });
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && (e.key === 'n' || e.key === 'N')) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          handleNewNoteRequested();
        }
      } else if (isMeta && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNewNoteRequested, setIsSidebarOpen]);
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (savePendingRef.current.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [savePendingRef]);
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
        onNewNote={handleNewNoteRequested} onDuplicateNote={handleDuplicateNote} onUpdateNote={handleUpdateNoteWithSnapshot}
        onTogglePin={handleTogglePin} onDeleteNote={handleDeleteNote} onPermanentDelete={handlePermanentDelete}
        onRestoreNote={handleRestoreNote} onEmptyTrash={handleEmptyTrash} onMoveNoteToFolder={handleMoveNoteToFolder}
        onCreateFolder={handleCreateFolder} onRenameFolder={handleRenameFolder} onDeleteFolder={handleDeleteFolder}
        onOpenLockModal={() => setIsLockModalOpen(true)} onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenSecurityModal={handleOpenSecurityModal} onUnlockSession={handleUnlockSession}
        autoSaveEnabled={autoSaveEnabled} onToggleAutoSave={handleToggleAutoSave}
        onManualSave={handleManualSave} saveSuccessMessage={saveSuccessMessage}
        isPendingSave={Boolean(selectedNoteId && unsyncedCount > 0)}
        onSelectFolderRequest={handleSelectFolder} onSelectTagRequest={handleSelectTag}
        onBackMobileRequest={handleBackMobile}
      />
      <NotesManagerModals
        selectedNote={selectedNote} isLockModalOpen={isLockModalOpen}
        isBackupModalOpen={isBackupModalOpen} isSecurityModalOpen={isSecurityModalOpen}
        storageProvider={storageProvider} notes={notes} folders={folders} token={token}
        userId={userId} userEmail={userEmail} onCloseLockModal={() => setIsLockModalOpen(false)}
        onCloseBackupModal={() => setIsBackupModalOpen(false)} onCloseSecurityModal={() => setIsSecurityModalOpen(false)}
        onSetLockPassword={handleSetLockPassword} onRemoveLock={handleRemoveLock}
        onUnlockSuccess={handleUnlockSession} onRestoreSuccess={handleRestoreSuccess}
        isUnsavedChangesModalOpen={isUnsavedModalOpen}
        onCloseUnsavedChangesModal={handleCloseUnsavedModal}
        onDiscardUnsavedChanges={handleDiscardUnsavedChanges}
        onSaveAndProceedUnsavedChanges={handleSaveAndProceedUnsavedChanges}
      />
    </div>
  );
};
export default QuickNotesManager;
