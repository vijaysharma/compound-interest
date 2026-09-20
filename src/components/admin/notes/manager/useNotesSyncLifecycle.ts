'use client';
import { useEffect } from 'react';
import { Note, SyncState } from '../NotesTypes';
import { loadAndDecryptNotes } from './notesLoader';
const SAVE_SWEEP_MS = 15_000;
interface UseNotesSyncLifecycleProps {
  token: string;
  userId: string;
  userEmail: string;
  reloadKey: number;
  notesRef: React.MutableRefObject<Note[]>;
  savePendingRef: React.MutableRefObject<Set<string>>;
  locallyDeletedRef: React.MutableRefObject<Set<string>>;
  foldersKeyRef: React.MutableRefObject<string>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setFolders: React.Dispatch<React.SetStateAction<string[]>>;
  setLoading: (l: boolean) => void;
  setSyncState: (s: SyncState) => void;
  setSyncError: (e: string) => void;
  setUnsyncedCount: (c: number) => void;
  setStorageProvider: (p: 'vercel_blob' | 'database_fallback' | null) => void;
  flushPendingSaves: () => Promise<void>;
  onSelectInitialNote: (reconciled: Note[]) => void;
}
export function useNotesSyncLifecycle({
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
}: UseNotesSyncLifecycleProps) {
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token) {
        if (isMounted) {
          setLoading(false);
          setSyncState('unauthenticated');
        }
        return;
      }
      if (isMounted) {
        setSyncState('syncing');
        setSyncError('');
      }
      try {
        const { notes: decrypted, storageProvider: prov } = await loadAndDecryptNotes(token, userId, userEmail);
        if (!isMounted) return;
        if (prov) setStorageProvider(prov);
        const reconciled = decrypted.filter((n) => !locallyDeletedRef.current.has(n.id));
        const unsaved = notesRef.current.filter(
          (n) => savePendingRef.current.has(n.id) && !reconciled.some((r) => r.id === n.id)
        );
        setNotes([...unsaved, ...reconciled]);
        setUnsyncedCount(savePendingRef.current.size);
        if (savePendingRef.current.size > 0) void flushPendingSaves();
        const fetchedFolders = reconciled.map((n) => n.folder).filter(Boolean);
        setFolders((prev) => {
          const combined = Array.from(new Set([...prev, ...fetchedFolders]));
          localStorage.setItem(foldersKeyRef.current, JSON.stringify(combined));
          return combined;
        });
        onSelectInitialNote(reconciled);
        if (isMounted) setSyncState('synced');
      } catch (err) {
        if (isMounted) {
          setSyncState('error');
          setSyncError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, userId, userEmail, reloadKey, flushPendingSaves, onSelectInitialNote, foldersKeyRef, locallyDeletedRef, notesRef, savePendingRef, setFolders, setLoading, setNotes, setStorageProvider, setSyncError, setSyncState, setUnsyncedCount]);
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      if (savePendingRef.current.size > 0) void flushPendingSaves();
    }, SAVE_SWEEP_MS);
    return () => clearInterval(id);
  }, [token, flushPendingSaves, savePendingRef]);
  useEffect(() => {
    const flush = () => void flushPendingSaves();
    const handleVis = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flushPendingSaves]);
}
