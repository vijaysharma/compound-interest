'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NotesSidebar } from './NotesSidebar';
import { NotesList } from './NotesList';
import { NotesEditor } from './NotesEditor';
import { NotesLockModal } from './NotesLockModal';
import { NotesBackupModal } from './NotesBackupModal';
import { NotesSecurityModal } from './NotesSecurityModal';
import {
  getUserEncryptionKey,
  encryptText,
  decryptText,
  isEncrypted,
} from './NotesCrypto';
import { useAuth } from '../../../context/useAuth';
import { Note, ViewMode, SortOption, SyncState, SYSTEM_FOLDERS, DEFAULT_CUSTOM_FOLDERS, extractHashtags } from './NotesTypes';
import { mergeRemoteWithLocal, readLocalNotes, writeLocalNotes } from './notesLocalStore';
import {
  getNotesAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  emptyTrashAction,
  getNotesStorageStatusAction,
} from '@/actions/notes';
import './quick-notes.css';
import styles from './QuickNotesManager.module.scss';
/** How often the in-memory notes are flushed to the localStorage buffer. */
const LOCAL_PERSIST_MS = 1_000;
/** How often unsynced notes are pushed to blob storage. */
const REMOTE_SYNC_MS = 60_000;
export const QuickNotesManager: React.FC<{ token: string }> = ({ token }) => {
  const { user } = useAuth();
  const userId = user?.id || 'default';
  const userEmail = user?.email || '';
  const foldersKey = `quick_notes_custom_folders_${userId}_v2`;
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const userCached = user?.id ? localStorage.getItem(`quick_notes_cache_${user.id}_v2`) : null;
      const legacyCached = localStorage.getItem('quick_notes_cache_v2');
      const cached = userCached || legacyCached;
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [folders, setFolders] = useState<string[]>(() => {
    try {
      const userCached = user?.id ? localStorage.getItem(`quick_notes_custom_folders_${user.id}_v2`) : null;
      const legacyCached = localStorage.getItem('quick_notes_custom_folders_v2');
      const cached = userCached || legacyCached;
      return cached ? JSON.parse(cached) : DEFAULT_CUSTOM_FOLDERS;
    } catch {
      return DEFAULT_CUSTOM_FOLDERS;
    }
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    try {
      const savedNoteId = localStorage.getItem(user?.id ? `quick_notes_${user.id}_last_note_id` : 'quick_notes_last_note_id');
      const userCached = user?.id ? localStorage.getItem(`quick_notes_cache_${user.id}_v2`) : null;
      const legacyCached = localStorage.getItem('quick_notes_cache_v2');
      const cached = userCached || legacyCached;
      const list = cached ? JSON.parse(cached) : [];
      if (savedNoteId && list.some((n: Note) => n.id === savedNoteId && !n.is_trashed)) {
        return savedNoteId;
      }
      if (savedNoteId) return savedNoteId;
      const firstActive = list.find((n: Note) => !n.is_trashed);
      return firstActive ? firstActive.id : null;
    } catch {
      return null;
    }
  });
  const [activeFolder, setActiveFolder] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(user?.id ? `quick_notes_${user.id}_last_folder` : 'quick_notes_last_folder');
      return saved || SYSTEM_FOLDERS.ALL;
    } catch {
      return SYSTEM_FOLDERS.ALL;
    }
  });
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    try {
      return localStorage.getItem(user?.id ? `quick_notes_${user.id}_last_tag` : 'quick_notes_last_tag');
    } catch {
      return null;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(user?.id ? `quick_notes_${user.id}_view_mode` : 'quick_notes_view_mode') as ViewMode;
      return saved === 'gallery' || saved === 'list' ? saved : 'list';
    } catch {
      return 'list';
    }
  });
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    try {
      const saved = localStorage.getItem(user?.id ? `quick_notes_${user.id}_sort_option` : 'quick_notes_sort_option') as SortOption;
      return saved || 'updated_desc';
    } catch {
      return 'updated_desc';
    }
  });
  const [loading, setLoading] = useState<boolean>(() => notes.length === 0);
  // localStorage is a persistence layer only: it seeds the list for an instant
  // first paint, but it must never be mistaken for server state. syncState
  // tracks whether what is on screen actually came back from the server.
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [syncError, setSyncError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);
  // Writes are applied optimistically to state and localStorage, so a failed
  // server write is otherwise invisible: the note looks saved but only exists
  // on this device. Surface it instead of logging to the console.
  const [saveError, setSaveError] = useState<string>('');
  // Mirror of `notes` for use inside timers and event handlers, which must not
  // capture a stale render's array.
  const notesRef = useRef<Note[]>(notes);
  // Read the buffer's metadata exactly once. A useRef initialiser is evaluated
  // on every render, so calling readLocalNotes there would re-parse the whole
  // note set on each keystroke.
  const [initialBuffer] = useState(() => readLocalNotes(userId));
  // Ids whose edits have not reached blob storage yet. Persisted alongside the
  // notes so a reload does not forget that work is outstanding.
  const dirtyRef = useRef<Set<string>>(new Set(initialBuffer.dirty));
  const syncedAtRef = useRef<string | null>(initialBuffer.syncedAt);
  const localWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef(false);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(initialBuffer.dirty.length);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(user?.id ? `quick_notes_${user.id}_sidebar_open` : 'quick_notes_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [storageProvider, setStorageProvider] = useState<'vercel_blob' | 'database_fallback' | null>(null);
  const [mobileScreen, setMobileScreen] = useState<'folders' | 'list' | 'editor'>(() => {
    try {
      const saved = localStorage.getItem(user?.id ? `quick_notes_${user.id}_last_mobile_screen` : 'quick_notes_last_mobile_screen') as 'folders' | 'list' | 'editor' | null;
      if (saved === 'editor' || saved === 'folders' || saved === 'list') return saved;
      return 'list';
    } catch {
      return 'list';
    }
  });
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const foldersKeyRef = useRef(foldersKey);
  useEffect(() => {
    foldersKeyRef.current = foldersKey;
  }, [foldersKey]);
  const persistLocalNow = useCallback(() => {
    if (localWriteTimerRef.current) {
      clearTimeout(localWriteTimerRef.current);
      localWriteTimerRef.current = null;
    }
    writeLocalNotes(userId, notesRef.current, dirtyRef.current, syncedAtRef.current);
  }, [userId]);
  /**
   * Throttled buffer write. The first call opens a LOCAL_PERSIST_MS window and
   * everything within it coalesces into a single write, so continuous typing
   * costs one serialisation per second rather than one per keystroke.
   */
  const schedulePersistLocal = useCallback(() => {
    if (localWriteTimerRef.current) return;
    localWriteTimerRef.current = setTimeout(() => {
      localWriteTimerRef.current = null;
      writeLocalNotes(userId, notesRef.current, dirtyRef.current, syncedAtRef.current);
    }, LOCAL_PERSIST_MS);
  }, [userId]);
  /**
   * Marks a note as owing blob storage a write. The note's authoritative values
   * are already in `notes`, so no payload is needed here — the periodic sync
   * reads whatever the latest version is at the time it runs.
   */
  const queueNoteSync = useCallback(
    (noteId: string) => {
      dirtyRef.current.add(noteId);
      setUnsyncedCount(dirtyRef.current.size);
      schedulePersistLocal();
    },
    [schedulePersistLocal]
  );
  /**
   * Pushes every dirty note to blob storage via the upsert in updateNoteAction.
   * Ids are stable from creation, so this covers notes that were never created
   * server-side as well as edits to existing ones.
   */
  const syncDirtyNotes = useCallback(async () => {
    if (!token) {
      if (dirtyRef.current.size > 0) {
        setSaveError('Not signed in — changes are saved on this device only.');
      }
      return;
    }
    if (syncInFlightRef.current || dirtyRef.current.size === 0) return;
    syncInFlightRef.current = true;
    setIsSaving(true);
    const pending = Array.from(dirtyRef.current);
    try {
      const key = await getUserEncryptionKey(userId, userEmail);
      for (const noteId of pending) {
        const note = notesRef.current.find((n) => n.id === noteId);
        if (!note) {
          dirtyRef.current.delete(noteId);
          continue;
        }
        // Never push a body the server told us it could not load, or the empty
        // placeholder would overwrite the real blob.
        if (note.content_unavailable) continue;
        await updateNoteAction(
          {
            id: note.id,
            title: await encryptText(note.title || '', key),
            content: await encryptText(note.content || '', key),
            folder: note.folder,
            is_pinned: note.is_pinned,
            is_locked: note.is_locked,
            lock_password_hash: note.lock_password_hash ?? null,
            is_trashed: note.is_trashed,
            tags: note.tags,
          },
          token
        );
        dirtyRef.current.delete(noteId);
      }
      syncedAtRef.current = new Date().toISOString();
      if (dirtyRef.current.size === 0) setSaveError('');
    } catch (err) {
      console.error('Failed to sync notes:', err);
      setSaveError(
        'Could not sync to storage — recent changes exist only on this device. ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      syncInFlightRef.current = false;
      setIsSaving(false);
      setUnsyncedCount(dirtyRef.current.size);
      persistLocalNow();
    }
  }, [token, userId, userEmail, persistLocalNow]);
  const flushPendingUpdates = syncDirtyNotes;
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token) {
        // No session on this origin. Bail out loudly rather than leaving the
        // overlay spinning forever with nothing logged.
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
        const key = await getUserEncryptionKey(userId, userEmail);
        const rawData = (await getNotesAction({ include_trashed: true }, token)) as unknown as Note[];
        if (isMounted) {
          const statusRes = await getNotesStorageStatusAction().catch(() => null);
          if (statusRes?.storage_provider) {
            setStorageProvider(statusRes.storage_provider as 'vercel_blob' | 'database_fallback');
          }
          const decryptedNotes: Note[] = await Promise.all(
            (rawData || []).map(async (n) => ({
              ...n,
              title: await decryptText(n.title || '', key),
              content: await decryptText(n.content || '', key),
            }))
          );
          if (!isMounted) return;
          // Blob storage is the durable copy; the local buffer may still hold
          // newer edits that have not been pushed yet. Reconcile rather than
          // overwrite, so an in-flight edit is not lost by a background fetch.
          const { notes: reconciled, dirty: stillDirty } = mergeRemoteWithLocal(
            decryptedNotes,
            notesRef.current,
            dirtyRef.current
          );
          dirtyRef.current = new Set(stillDirty);
          setUnsyncedCount(dirtyRef.current.size);
          syncedAtRef.current = new Date().toISOString();
          setNotes(reconciled);
          // Anything the merge kept as local-only or newer still owes the
          // server a write, so push it straight away instead of waiting for
          // the next interval.
          if (stillDirty.length > 0) void syncDirtyNotes();
          if (Array.isArray(reconciled)) {
            const fetchedFolders = reconciled.map((n) => n.folder).filter(Boolean);
            setFolders((prev) => {
              const combined = Array.from(new Set([...prev, ...fetchedFolders]));
              localStorage.setItem(foldersKeyRef.current, JSON.stringify(combined));
              return combined;
            });
            setSelectedNoteId((curr) => {
              const savedNoteId = localStorage.getItem(userId !== 'default' ? `quick_notes_${userId}_last_note_id` : 'quick_notes_last_note_id');
              const target = curr || savedNoteId;
              if (target && reconciled.some((n) => n.id === target && !n.is_trashed)) {
                return target;
              }
              const firstActive = reconciled.find((n) => !n.is_trashed);
              return firstActive ? firstActive.id : null;
            });
          }
          // Auto-migrate any unencrypted legacy notes in the background without blocking UI
          const unencryptedLegacy = (rawData || []).filter(
            (n) =>
              (n.title && !isEncrypted(n.title)) ||
              (n.content && !isEncrypted(n.content))
          );
          if (unencryptedLegacy.length > 0) {
            void Promise.all(
              unencryptedLegacy.map(async (legacy) => {
                try {
                  const encTitle = await encryptText(legacy.title || '', key);
                  const encContent = await encryptText(legacy.content || '', key);
                  await updateNoteAction({
                    id: legacy.id,
                    title: encTitle,
                    content: encContent,
                  }, token);
                } catch {
                  // Ignore individual background migration error
                }
              })
            );
          }
          if (isMounted) setSyncState('synced');
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
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
  }, [token, userId, userEmail, reloadKey, syncDirtyNotes]);
  // Persist revisit states
  useEffect(() => {
    const key = user?.id ? `quick_notes_${user.id}_last_note_id` : 'quick_notes_last_note_id';
    if (selectedNoteId) {
      localStorage.setItem(key, selectedNoteId);
    } else {
      localStorage.removeItem(key);
    }
  }, [selectedNoteId, user?.id]);
  useEffect(() => {
    const key = user?.id ? `quick_notes_${user.id}_last_folder` : 'quick_notes_last_folder';
    if (activeFolder) {
      localStorage.setItem(key, activeFolder);
    }
  }, [activeFolder, user?.id]);
  useEffect(() => {
    const key = user?.id ? `quick_notes_${user.id}_last_mobile_screen` : 'quick_notes_last_mobile_screen';
    localStorage.setItem(key, mobileScreen);
  }, [mobileScreen, user?.id]);
  useEffect(() => {
    const key = user?.id ? `quick_notes_${user.id}_last_tag` : 'quick_notes_last_tag';
    if (activeTag) {
      localStorage.setItem(key, activeTag);
    } else {
      localStorage.removeItem(key);
    }
  }, [activeTag, user?.id]);
  useEffect(() => {
    const key = user?.id ? `quick_notes_${user.id}_view_mode` : 'quick_notes_view_mode';
    localStorage.setItem(key, viewMode);
  }, [viewMode, user?.id]);
  useEffect(() => {
    const key = user?.id ? `quick_notes_${user.id}_sort_option` : 'quick_notes_sort_option';
    localStorage.setItem(key, sortOption);
  }, [sortOption, user?.id]);
  useEffect(() => {
    const key = user?.id ? `quick_notes_${user.id}_sidebar_open` : 'quick_notes_sidebar_open';
    localStorage.setItem(key, String(isSidebarOpen));
  }, [isSidebarOpen, user?.id]);
  const effectiveNoteId = selectedNoteId || notes.find((n) => !n.is_trashed)?.id || null;
  const selectedNote = notes.find((n) => n.id === effectiveNoteId) || null;
  const effectiveMobileScreen: 'folders' | 'list' | 'editor' =
    isMobile && mobileScreen === 'editor' && !selectedNote ? 'list' : mobileScreen;
  /** Writes the buffer now, cancelling any pending throttled write. */
  const handleSelectNote = useCallback(
    (note: Note) => {
      if (dirtyRef.current.size > 0) {
        void flushPendingUpdates();
      }
      setSelectedNoteId(note.id);
      setMobileScreen('editor');
    },
    [flushPendingUpdates]
  );
  // Keep the ref and the localStorage buffer in step with every state change,
  // whichever handler caused it.
  useEffect(() => {
    notesRef.current = notes;
    schedulePersistLocal();
  }, [notes, schedulePersistLocal]);
  // Periodic push to blob storage.
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      void syncDirtyNotes();
    }, REMOTE_SYNC_MS);
    return () => clearInterval(id);
  }, [token, syncDirtyNotes]);
  // The sync interval means up to REMOTE_SYNC_MS of work is only buffered, so
  // force a flush whenever the tab is being backgrounded or torn down.
  // `pagehide` is used rather than `beforeunload`, which does not fire
  // reliably on mobile Safari.
  useEffect(() => {
    const flush = () => {
      persistLocalNow();
      void syncDirtyNotes();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [persistLocalNow, syncDirtyNotes]);
  const handleUpdateNote = useCallback(
    (updatedFields: Partial<Note>) => {
      if (!selectedNoteId) return;
      const updatedTime = new Date().toISOString();
      const payload: Partial<Note> = {
        ...updatedFields,
        updated_at: updatedFields.updated_at || updatedTime,
      };
      setNotes((prevNotes) => {
        const next = prevNotes.map((n) => (n.id === selectedNoteId ? { ...n, ...payload } : n));
        return next;
      });
      queueNoteSync(selectedNoteId);
    },
    [selectedNoteId, queueNoteSync]
  );
  const handleNewNote = useCallback(async () => {
    if (dirtyRef.current.size > 0) {
      await flushPendingUpdates();
    }
    let targetFolder = 'Quick Notes';
    if (
      activeFolder !== SYSTEM_FOLDERS.ALL &&
      activeFolder !== SYSTEM_FOLDERS.PINNED &&
      activeFolder !== SYSTEM_FOLDERS.TRASH
    ) {
      targetFolder = activeFolder;
    }
    const tempId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const newNote: Note = {
      id: tempId,
      title: '',
      content: '',
      folder: targetFolder,
      is_pinned: false,
      is_locked: false,
      is_trashed: false,
      tags: activeTag ? [activeTag.toLowerCase()] : [],
      created_at: nowIso,
      updated_at: nowIso,
    };
    setNotes((prev) => {
      const next = [newNote, ...prev];
      return next;
    });
    setSelectedNoteId(tempId);
    setMobileScreen('editor');
    if (!token) {
      setSaveError('Not signed in — this change was saved on this device only.');
      return;
    }
    try {
      const key = await getUserEncryptionKey(userId, userEmail);
      const encTitle = await encryptText('', key);
      const encContent = await encryptText('', key);
      const created = (await createNoteAction({
        id: tempId,
        title: encTitle,
        content: encContent,
        folder: targetFolder,
        tags: newNote.tags,
      }, token)) as unknown as Note;
      const decryptedCreated: Note = {
        ...created,
        title: await decryptText(created.title || '', key),
        content: await decryptText(created.content || '', key),
      };
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === tempId
            ? {
                ...decryptedCreated,
                title: n.title || decryptedCreated.title,
                content: n.content || decryptedCreated.content,
                is_pinned: n.is_pinned,
                folder: n.folder,
                tags: n.tags,
              }
            : n
        );
        return next;
      });
      setSelectedNoteId(decryptedCreated.id);
    } catch (err) {
      console.error('Failed to create note on server:', err);
      setSaveError(
        `Could not create note on server on the server — this change exists only on this device. ` +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }, [activeFolder, activeTag, token, userId, userEmail, flushPendingUpdates]);
  const handleTogglePin = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;
      const newPinState = !target.is_pinned;
      const updatedTime = new Date().toISOString();
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === targetId ? { ...n, is_pinned: newPinState, updated_at: updatedTime } : n
        );
        return next;
      });
      queueNoteSync(targetId);
    },
    [notes, selectedNoteId, queueNoteSync]
  );
  const handlePermanentDelete = useCallback(
    async (id?: string) => {
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      // The row is about to be deleted, so drop any outstanding sync for it —
      // an upsert would otherwise recreate it.
      dirtyRef.current.delete(targetId);
      setUnsyncedCount(dirtyRef.current.size);
      if (dirtyRef.current.size > 0) {
        await flushPendingUpdates();
      }
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== targetId);
        return next;
      });
      if (selectedNoteId === targetId) {
        const remaining = notes.filter((n) => {
          if (n.id === targetId) return false;
          if (activeFolder === SYSTEM_FOLDERS.TRASH) return n.is_trashed;
          return !n.is_trashed;
        });
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        setMobileScreen('list');
      }
      if (!token) {
        setSaveError('Not signed in — this change was saved on this device only.');
        return;
      }
      try {
        await deleteNoteAction({ id: targetId, permanent: true }, token);
      } catch (err) {
        console.error('Failed to permanently delete note:', err);
        setSaveError(
          `Could not permanently delete note on the server — this change exists only on this device. ` +
            (err instanceof Error ? err.message : 'Unknown error')
        );
      }
    },
    [notes, selectedNoteId, token, flushPendingUpdates]
  );
  const handleDeleteNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;
      if (target.is_trashed) {
        handlePermanentDelete(targetId);
        return;
      }
      if (dirtyRef.current.size > 0) {
        void flushPendingUpdates();
      }
      const updatedTime = new Date().toISOString();
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === targetId ? { ...n, is_trashed: true, updated_at: updatedTime } : n
        );
        return next;
      });
      if (selectedNoteId === targetId) {
        const remaining = notes.filter((n) => n.id !== targetId && !n.is_trashed);
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        setMobileScreen('list');
      }
      queueNoteSync(targetId);
    },
    [notes, selectedNoteId, queueNoteSync, handlePermanentDelete, flushPendingUpdates]
  );
  const handleRestoreNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      if (dirtyRef.current.size > 0) {
        void flushPendingUpdates();
      }
      const updatedTime = new Date().toISOString();
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === targetId ? { ...n, is_trashed: false, updated_at: updatedTime } : n
        );
        return next;
      });
      queueNoteSync(targetId);
    },
    [selectedNoteId, queueNoteSync, flushPendingUpdates]
  );
  const handleDuplicateNote = useCallback(
    async (noteToDupe?: Note, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (dirtyRef.current.size > 0) {
        await flushPendingUpdates();
      }
      const baseNote = noteToDupe || selectedNote;
      if (!baseNote) return;
      const tempId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();
      const duplicated: Note = {
        ...baseNote,
        id: tempId,
        title: baseNote.title ? `${baseNote.title} (Copy)` : 'Copy of Note',
        created_at: nowIso,
        updated_at: nowIso,
        is_pinned: false,
      };
      setNotes((prev) => {
        const next = [duplicated, ...prev];
        return next;
      });
      setSelectedNoteId(tempId);
      setMobileScreen('editor');
      if (!token) {
        setSaveError('Not signed in — this change was saved on this device only.');
        return;
      }
      try {
        const key = await getUserEncryptionKey(userId, userEmail);
        const encTitle = await encryptText(duplicated.title || '', key);
        const encContent = await encryptText(duplicated.content || '', key);
        const created = (await createNoteAction({
          id: tempId,
          title: encTitle,
          content: encContent,
          folder: duplicated.folder,
          tags: duplicated.tags,
          is_pinned: false,
        }, token)) as unknown as Note;
        const decryptedCreated: Note = {
          ...created,
          title: await decryptText(created.title || '', key),
          content: await decryptText(created.content || '', key),
        };
        setNotes((prev) => {
          const next = prev.map((n) => (n.id === tempId ? decryptedCreated : n));
          return next;
        });
        setSelectedNoteId(decryptedCreated.id);
      } catch (err) {
        console.error('Failed to duplicate note:', err);
        setSaveError(
          `Could not duplicate note on the server — this change exists only on this device. ` +
            (err instanceof Error ? err.message : 'Unknown error')
        );
      }
    },
    [selectedNote, token, userId, userEmail, flushPendingUpdates]
  );
  const handleEmptyTrash = useCallback(async () => {
    if (
      !window.confirm('Permanently delete all notes in Recently Deleted? This cannot be undone.')
    ) {
      return;
    }
    setNotes((prev) => {
      const next = prev.filter((n) => !n.is_trashed);
      return next;
    });
    setSelectedNoteId(null);
    if (!token) {
      setSaveError('Not signed in — this change was saved on this device only.');
      return;
    }
    try {
      await emptyTrashAction(token);
    } catch (err) {
      console.error('Failed to empty trash on server:', err);
      setSaveError(
        `Could not empty trash on server on the server — this change exists only on this device. ` +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }, [token]);
  const handleCreateFolder = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || folders.includes(cleanName)) return;
    const next = [...folders, cleanName];
    setFolders(next);
    localStorage.setItem(foldersKeyRef.current, JSON.stringify(next));
    setActiveFolder(cleanName);
    if (isMobile) {
      setMobileScreen('list');
    }
  };
  const handleRenameFolder = (oldName: string, newName: string) => {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanNew || cleanOld === cleanNew) return;
    const nextFolders = folders.map((f) => (f === cleanOld ? cleanNew : f));
    setFolders(nextFolders);
    localStorage.setItem(foldersKeyRef.current, JSON.stringify(nextFolders));
    if (activeFolder === cleanOld) {
      setActiveFolder(cleanNew);
    }
    setNotes((prev) => {
      const nextNotes = prev.map((n) => (n.folder === cleanOld ? { ...n, folder: cleanNew } : n));
      return nextNotes;
    });
    notes
      .filter((n) => n.folder === cleanOld)
      .forEach((n) => queueNoteSync(n.id));
  };
  const handleDeleteFolder = (name: string) => {
    const nextFolders = folders.filter((f) => f !== name);
    setFolders(nextFolders);
    localStorage.setItem(foldersKeyRef.current, JSON.stringify(nextFolders));
    if (activeFolder === name) {
      setActiveFolder(SYSTEM_FOLDERS.ALL);
    }
    setNotes((prev) => {
      const nextNotes = prev.map((n) => (n.folder === name ? { ...n, folder: 'Quick Notes' } : n));
      return nextNotes;
    });
    notes
      .filter((n) => n.folder === name)
      .forEach((n) => queueNoteSync(n.id));
  };
  const handleSetLockPassword = (hash: string) => {
    if (!selectedNoteId) return;
    handleUpdateNote({
      is_locked: true,
      lock_password_hash: hash,
    });
    setUnlockedNotes((prev) => new Set([...prev, selectedNoteId]));
  };
  const handleRemoveLock = () => {
    if (!selectedNoteId) return;
    handleUpdateNote({
      is_locked: false,
      lock_password_hash: '',
    });
    setUnlockedNotes((prev) => {
      const next = new Set(prev);
      next.delete(selectedNoteId);
      return next;
    });
  };
  const handleUnlockSession = () => {
    if (!selectedNoteId) return;
    setUnlockedNotes((prev) => new Set([...prev, selectedNoteId]));
  };
  const handleRestoreSuccess = (restoredNotes: Note[], restoredFolders: string[]) => {
    setNotes(restoredNotes);
    if (restoredFolders && restoredFolders.length > 0) {
      setFolders((prev) => {
        const combined = Array.from(new Set([...prev, ...restoredFolders]));
        localStorage.setItem(foldersKeyRef.current, JSON.stringify(combined));
        return combined;
      });
    }
    const first = restoredNotes.find((n) => !n.is_trashed);
    if (first) {
      setSelectedNoteId(first.id);
    }
  };
  const handleMoveNoteToFolder = useCallback(
    (noteId: string, targetFolder: string) => {
      const updatedTime = new Date().toISOString();
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === noteId ? { ...n, folder: targetFolder, updated_at: updatedTime } : n
        );
        return next;
      });
      queueNoteSync(noteId);
    },
    [queueNoteSync]
  );
  const handleCloseSidebar = useCallback(() => {
    if (isMobile) {
      setMobileScreen('list');
    } else {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);
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
  }, [handleNewNote]);
  const handleOpenSecurityModal = useCallback(() => {
    setIsSecurityModalOpen(true);
    if (!storageProvider && token) {
      getNotesStorageStatusAction()
        .then((data) => {
          if (data?.storage_provider) {
            setStorageProvider(data.storage_provider as 'vercel_blob' | 'database_fallback');
          }
        })
        .catch(() => {});
    }
  }, [storageProvider, token]);
  const trashedCount = notes.filter((n) => n.is_trashed).length;
  const isSelectedNoteUnlocked = selectedNoteId ? unlockedNotes.has(selectedNoteId) : false;
  return (
    <div className={`${styles.container} quick-notes-theme`}>
      {loading && notes.length === 0 && (
        <div className={styles.loadingOverlay}>
          <span className={styles.spinner}></span>
        </div>
      )}
      <div className={styles.syncBannerStack}>
        {syncState === 'unauthenticated' && (
          <div className={styles.syncBanner}>
            <span>
              You are not signed in on this device, so your saved notes could not be
              loaded. Sign in to sync them.
            </span>
          </div>
        )}
        {saveError && (
          <div className={`${styles.syncBanner} ${styles.syncBannerError}`}>
            <span>{saveError}</span>
            <button type="button" className={styles.syncRetryBtn} onClick={() => setSaveError('')}>
              Dismiss
            </button>
          </div>
        )}
        {unsyncedCount > 0 && (
          <div className={`${styles.syncBanner} ${styles.syncBannerPending}`}>
            <span>
              {unsyncedCount} {unsyncedCount === 1 ? 'note' : 'notes'} not yet synced to
              storage.
            </span>
            <button
              type="button"
              className={styles.syncRetryBtn}
              onClick={() => void syncDirtyNotes()}
              disabled={isSaving}
            >
              {isSaving ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        )}
        {syncState === 'error' && (
          <div className={styles.syncBanner}>
            <span>
              {notes.length > 0
                ? 'Showing locally saved notes — could not reach the server, so recent changes from other devices are missing.'
                : 'Could not load your notes from the server.'}
              {syncError ? ` (${syncError})` : ''}
            </span>
            <button type="button" className={styles.syncRetryBtn} onClick={() => setReloadKey((n) => n + 1)}>
              Retry
            </button>
          </div>
        )}
      </div>
      <div
        className={`${styles.sidebarPane} ${
          isMobile
            ? effectiveMobileScreen === 'folders'
              ? styles.mobileVisible
              : styles.hidden
            : isSidebarOpen
              ? styles.desktopVisible
              : styles.hidden
        }`}
      >
        <NotesSidebar
          activeFolder={activeFolder}
          activeTag={activeTag}
          folders={folders}
          notes={notes}
          trashedCount={trashedCount}
          onSelectFolder={(f) => {
            setActiveFolder(f);
            setActiveTag(null);
            if (isMobile) {
              setMobileScreen('list');
            } else {
              const folderNotes = notes.filter((n) => {
                if (f === SYSTEM_FOLDERS.ALL) return !n.is_trashed;
                if (f === SYSTEM_FOLDERS.TRASH) return n.is_trashed;
                if (f === SYSTEM_FOLDERS.PINNED) return n.is_pinned && !n.is_trashed;
                return n.folder === f && !n.is_trashed;
              });
              if (!folderNotes.some((n) => n.id === selectedNoteId)) {
                setSelectedNoteId(folderNotes[0]?.id || null);
              }
            }
          }}
          onSelectTag={(t) => {
            setActiveTag(t);
            if (isMobile) {
              setMobileScreen('list');
            } else if (t) {
              const tagNotes = notes.filter((n) => {
                if (n.is_trashed) return false;
                const hashtags = extractHashtags(n.title + ' ' + n.content);
                const combined = new Set([...(n.tags || []), ...hashtags].map((x) => x.toLowerCase()));
                return combined.has(t.toLowerCase());
              });
              if (!tagNotes.some((n) => n.id === selectedNoteId)) {
                setSelectedNoteId(tagNotes[0]?.id || null);
              }
            }
          }}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          isOpen={isMobile ? effectiveMobileScreen === 'folders' : isSidebarOpen}
          onClose={handleCloseSidebar}
          onCloseMobile={() => setMobileScreen('list')}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenSecurityModal={handleOpenSecurityModal}
          onNewNote={handleNewNote}
          isMobileScreen={isMobile && effectiveMobileScreen === 'folders'}
        />
      </div>
      <div
        className={`${styles.listPane} ${
          isMobile && effectiveMobileScreen === 'list' ? styles.mobileVisible : ''
        }`}
      >
        <NotesList
          notes={notes}
          selectedNoteId={selectedNoteId}
          activeFolder={activeFolder}
          activeTag={activeTag}
          searchQuery={searchQuery}
          viewMode={viewMode}
          sortOption={sortOption}
          folders={folders}
          onSelectNote={handleSelectNote}
          onNewNote={handleNewNote}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onSortChange={setSortOption}
          onTogglePin={handleTogglePin}
          onDeleteNote={handleDeleteNote}
          onPermanentDelete={handlePermanentDelete}
          onDuplicateNote={handleDuplicateNote}
          onRestoreNote={handleRestoreNote}
          onEmptyTrash={handleEmptyTrash}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          onCreateFolder={handleCreateFolder}
          onBackToFolders={() => setMobileScreen('folders')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenSecurityModal={handleOpenSecurityModal}
          isMobileScreen={isMobile && effectiveMobileScreen === 'list'}
        />
      </div>
      <div
        className={`${styles.editorPane} ${
          isMobile && effectiveMobileScreen === 'editor' ? styles.mobileVisible : ''
        }`}
      >
        <NotesEditor
          note={selectedNote}
          folders={folders}
          isSaving={isSaving}
          onUpdateNote={handleUpdateNote}
          onTogglePin={() => handleTogglePin()}
          onDeleteNote={() => handleDeleteNote()}
          onRestoreNote={() => handleRestoreNote()}
          onPermanentDelete={() => handlePermanentDelete()}
          onNewNote={handleNewNote}
          onOpenLockModal={() => setIsLockModalOpen(true)}
          onDuplicateNote={() => handleDuplicateNote()}
          isUnlockedInSession={isSelectedNoteUnlocked}
          onUnlockSession={handleUnlockSession}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onBackMobile={() => setMobileScreen('list')}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenSecurityModal={handleOpenSecurityModal}
          onCreateFolder={handleCreateFolder}
          folderTitle={activeFolder === SYSTEM_FOLDERS.ALL ? 'All Notes' : activeFolder}
          isMobileScreen={isMobile && effectiveMobileScreen === 'editor'}
        />
      </div>
      {selectedNote && (
        <NotesLockModal
          isOpen={isLockModalOpen}
          isLocked={Boolean(selectedNote.is_locked)}
          hasPasswordHash={Boolean(selectedNote.lock_password_hash)}
          expectedHash={selectedNote.lock_password_hash}
          onClose={() => setIsLockModalOpen(false)}
          onSetPassword={handleSetLockPassword}
          onRemoveLock={handleRemoveLock}
          onUnlockSuccess={handleUnlockSession}
        />
      )}
      <NotesBackupModal
        isOpen={isBackupModalOpen}
        notes={notes}
        folders={folders}
        token={token}
        userId={userId}
        userEmail={userEmail}
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreSuccess={handleRestoreSuccess}
      />
      <NotesSecurityModal
        isOpen={isSecurityModalOpen}
        storageProvider={storageProvider}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};
export default QuickNotesManager;
