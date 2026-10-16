'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, SyncState } from '../NotesTypes';
import { savePendingNotes } from './notesSaver';
import { getInitialCustomFolders } from './notesLoader';
import { useNotesSyncLifecycle } from './useNotesSyncLifecycle';
import { removeLocalDraft } from './notesDraftStorage';
const SAVE_DEBOUNCE_MS = 2_500;
interface UseNotesSyncProps {
  token: string;
  userId: string;
  userEmail: string;
  autoSaveEnabled?: boolean;
  onSelectInitialNote: (reconciled: Note[]) => void;
}
export function useNotesSync({ token, userId, userEmail, autoSaveEnabled = true, onSelectInitialNote }: UseNotesSyncProps) {
  const foldersKey = `quick_notes_custom_folders_${userId}_v2`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<string[]>(() => getInitialCustomFolders(userId));
  const [loading, setLoading] = useState<boolean>(() => notes.length === 0);
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [syncError, setSyncError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);
  const [saveError, setSaveError] = useState<string>('');
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [storageProvider, setStorageProvider] = useState<'vercel_blob' | 'database_fallback' | null>(null);
  const notesRef = useRef<Note[]>(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  const foldersKeyRef = useRef(foldersKey);
  useEffect(() => { foldersKeyRef.current = foldersKey; }, [foldersKey]);
  const savePendingRef = useRef<Set<string>>(new Set());
  const locallyDeletedRef = useRef<Set<string>>(new Set());
  const unconfirmedCreatesRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const flushPendingSaves = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!token) {
      if (savePendingRef.current.size > 0) {
        setSaveError('Not signed in — this change has not been saved.');
      }
      return;
    }
    if (saveInFlightRef.current || savePendingRef.current.size === 0) return;
    saveInFlightRef.current = true;
    setIsSaving(true);
    try {
      const { deletedElsewhereIds, staleWrite, savedIds, savedNotes } = await savePendingNotes({
        notes: notesRef.current,
        pendingIds: Array.from(savePendingRef.current),
        token,
        userId,
        userEmail,
        unconfirmedCreates: unconfirmedCreatesRef.current,
      });
      savedIds.forEach((id) => {
        savePendingRef.current.delete(id);
        removeLocalDraft(userId, id);
      });
      if (savedNotes.length > 0) {
        const updateMap = new Map(savedNotes.filter((s) => s.updated_at).map((s) => [s.id, s.updated_at!]));
        if (updateMap.size > 0) {
          setNotes((prev) => prev.map((n) => {
            const newTime = updateMap.get(n.id);
            return newTime ? { ...n, updated_at: newTime } : n;
          }));
        }
      }
      if (deletedElsewhereIds.length > 0) {
        deletedElsewhereIds.forEach((id) => locallyDeletedRef.current.add(id));
        setNotes((prev) => prev.filter((n) => !deletedElsewhereIds.includes(n.id)));
        setSaveError('That note was deleted on another device, so the edit was discarded.');
      } else if (staleWrite) {
        setSaveError('A newer version of that note exists elsewhere; reloading it.');
        setReloadKey((n) => n + 1);
      } else if (savePendingRef.current.size === 0) {
        setSaveError('');
      }
    } catch (err) {
      setSaveError(
        'Could not save to storage: ' + (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
      setUnsyncedCount(savePendingRef.current.size);
    }
  }, [token, userId, userEmail]);
  const queueNoteSync = useCallback((noteId: string) => {
    savePendingRef.current.add(noteId);
    setUnsyncedCount((prev) => (prev === savePendingRef.current.size ? prev : savePendingRef.current.size));
    if (!autoSaveEnabled) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void flushPendingSaves();
    }, SAVE_DEBOUNCE_MS);
  }, [flushPendingSaves, autoSaveEnabled]);
  useNotesSyncLifecycle({
    token,
    userId,
    userEmail,
    reloadKey,
    notesRef,
    savePendingRef,
    locallyDeletedRef,
    foldersKeyRef,
    setNotes,
    setFolders,
    setLoading,
    setSyncState,
    setSyncError,
    setUnsyncedCount,
    setStorageProvider,
    flushPendingSaves,
    onSelectInitialNote,
  });
  return {
    notes,
    setNotes,
    folders,
    setFolders,
    foldersKeyRef,
    loading,
    syncState,
    syncError,
    setReloadKey,
    saveError,
    setSaveError,
    unsyncedCount,
    setUnsyncedCount,
    isSaving,
    storageProvider,
    setStorageProvider,
    flushPendingSaves,
    queueNoteSync,
    savePendingRef,
    locallyDeletedRef,
    unconfirmedCreatesRef,
  };
}
