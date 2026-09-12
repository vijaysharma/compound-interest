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
/**
 * Idle delay before an edited note is written to blob storage. Short on
 * purpose: the server is the only copy of a note, so this is the entire window
 * in which unsaved work exists. Discrete actions (delete, trash, restore, move)
 * bypass it and go out immediately.
 */
const SAVE_DEBOUNCE_MS = 1_500;
/** Safety net in case a debounced save is somehow missed. */
const SAVE_SWEEP_MS = 15_000;
export const QuickNotesManager: React.FC<{ token: string }> = ({ token }) => {
  const { user } = useAuth();
  const userId = user?.id || 'default';
  const userEmail = user?.email || '';
  const foldersKey = `quick_notes_custom_folders_${userId}_v2`;
  // Notes come from the server only. localStorage holds UI state (selected
  // note, folder, view mode) but never note data: a local replica cannot tell
  // "deleted on another device" from "not yet created", so replaying it
  // resurrects deleted notes through the upsert.
  const [notes, setNotes] = useState<Note[]>([]);
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
      // Route persistence: remember which note was open. Validated against the
      // server's list once it arrives.
      return localStorage.getItem(
        user?.id ? `quick_notes_${user.id}_last_note_id` : 'quick_notes_last_note_id'
      );
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
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
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
  /**
   * Ids edited since their last successful save. In memory only — this is a
   * queue of outstanding work, not a copy of the notes.
   */
  const savePendingRef = useRef<Set<string>>(new Set());
  /** Ids deleted in this session, so an in-flight fetch cannot re-add them. */
  const locallyDeletedRef = useRef<Set<string>>(new Set());
  /**
   * Ids created on this device whose creation the server has not confirmed.
   * These are the only notes a save is allowed to create; anything else must
   * already exist server-side, so a missing row means it was deleted.
   */
  const unconfirmedCreatesRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  /**
   * Writes every outstanding note to blob storage. Rejections are acted on
   * rather than retried: the server refuses writes to a note deleted elsewhere,
   * and writes based on a copy older than what it already holds.
   */
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
    const pending = Array.from(savePendingRef.current);
    let deletedElsewhere = false;
    let staleWrite = false;
    try {
      const key = await getUserEncryptionKey(userId, userEmail);
      for (const noteId of pending) {
        const note = notesRef.current.find((n) => n.id === noteId);
        if (!note) {
          savePendingRef.current.delete(noteId);
          continue;
        }
        // Never push a body the server told us it could not read, or the empty
        // placeholder would overwrite the real blob.
        if (note.content_unavailable) continue;
        const payload = {
          id: note.id,
          title: await encryptText(note.title || '', key),
          content: await encryptText(note.content || '', key),
          folder: note.folder,
          is_pinned: note.is_pinned,
          is_locked: note.is_locked,
          lock_password_hash: note.lock_password_hash ?? null,
          is_trashed: note.is_trashed,
          tags: note.tags,
        };
        if (unconfirmedCreatesRef.current.has(noteId)) {
          // Never confirmed server-side, so this save has to create it.
          await createNoteAction(
            { ...payload, lock_password_hash: payload.lock_password_hash ?? undefined },
            token
          );
          unconfirmedCreatesRef.current.delete(noteId);
          savePendingRef.current.delete(noteId);
          continue;
        }
        const res = await updateNoteAction(
          { ...payload, client_updated_at: note.updated_at },
          token
        );
        savePendingRef.current.delete(noteId);
        if (res?.rejected === 'missing') {
          // The row is gone, so it was deleted on another device. Drop it here
          // rather than recreating it.
          deletedElsewhere = true;
          locallyDeletedRef.current.add(noteId);
          setNotes((prev) => prev.filter((n) => n.id !== noteId));
        } else if (res?.rejected === 'stale') {
          staleWrite = true;
        }
      }
      if (deletedElsewhere) {
        setSaveError('That note was deleted on another device, so the edit was discarded.');
      } else if (staleWrite) {
        setSaveError('A newer version of that note exists elsewhere; reloading it.');
      } else if (savePendingRef.current.size === 0) {
        setSaveError('');
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
      setSaveError(
        'Could not save to storage — this change is not stored anywhere yet. ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
      setUnsyncedCount(savePendingRef.current.size);
      // A stale rejection means another device is ahead of us; pull its copy.
      if (staleWrite) setReloadKey((n) => n + 1);
    }
  }, [token, userId, userEmail]);
  /** Marks a note as needing a save and (re)starts the idle timer. */
  const queueNoteSync = useCallback(
    (noteId: string) => {
      savePendingRef.current.add(noteId);
      setUnsyncedCount(savePendingRef.current.size);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void flushPendingSaves();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushPendingSaves]
  );
  const flushPendingUpdates = flushPendingSaves;
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
          // The server's list replaces local state outright — no merge. A note
          // absent here has been deleted, and reviving it from a local copy is
          // exactly the resurrection bug. The only exception is a note still
          // waiting to be saved, which the server has not been told about yet.
          const reconciled = decryptedNotes.filter(
            (n) => !locallyDeletedRef.current.has(n.id)
          );
          const unsaved = notesRef.current.filter(
            (n) =>
              savePendingRef.current.has(n.id) &&
              !reconciled.some((r) => r.id === n.id)
          );
          setNotes([...unsaved, ...reconciled]);
          setUnsyncedCount(savePendingRef.current.size);
          if (savePendingRef.current.size > 0) void flushPendingSaves();
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
  }, [token, userId, userEmail, reloadKey, flushPendingSaves]);
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
      if (savePendingRef.current.size > 0) {
        void flushPendingUpdates();
      }
      setSelectedNoteId(note.id);
      setMobileScreen('editor');
    },
    [flushPendingUpdates]
  );
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  // Earlier versions mirrored every note into localStorage. Those entries are
  // now unused and can be several megabytes, so clear them once on mount.
  useEffect(() => {
    try {
      localStorage.removeItem(`quick_notes_cache_${userId}_v2`);
      localStorage.removeItem('quick_notes_cache_v2');
      localStorage.removeItem(`quick_notes_sync_meta_${userId}_v1`);
    } catch {
      // Nothing to do if storage is unavailable.
    }
  }, [userId]);
  // Safety net: the debounce above is the primary trigger, this only catches a
  // save that was somehow left outstanding.
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      if (savePendingRef.current.size > 0) void flushPendingSaves();
    }, SAVE_SWEEP_MS);
    return () => clearInterval(id);
  }, [token, flushPendingSaves]);
  // The debounce window is the only time unsaved work exists, so collapse it
  // whenever the tab is backgrounded or torn down. `pagehide` is used rather
  // than `beforeunload`, which is unreliable on mobile Safari.
  useEffect(() => {
    const flush = () => {
      void flushPendingSaves();
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
  }, [flushPendingSaves]);
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
    if (savePendingRef.current.size > 0) {
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
    // Until the server confirms it, a save for this id must create rather than
    // update, since there is no row to update yet.
    unconfirmedCreatesRef.current.add(tempId);
    if (!token) {
      setSaveError('Not signed in — this note has not been saved.');
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
      unconfirmedCreatesRef.current.delete(tempId);
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
      queueNoteSync(tempId);
      setSaveError(
        `Could not create note on server on the server — this change exists only on this device. ` +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }, [activeFolder, activeTag, token, userId, userEmail, flushPendingUpdates, queueNoteSync]);
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
      // Drop any outstanding save for this note and record the deletion, so a
      // fetch already in flight cannot re-add it to the list.
      savePendingRef.current.delete(targetId);
      locallyDeletedRef.current.add(targetId);
      setUnsyncedCount(savePendingRef.current.size);
      if (savePendingRef.current.size > 0) {
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
        setSaveError('Not signed in — this note has not been deleted on the server.');
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
      if (savePendingRef.current.size > 0) {
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
      // Trash is a discrete action, not typing: push it immediately so another
      // device cannot keep showing the note as live.
      queueNoteSync(targetId);
      void flushPendingSaves();
    },
    [notes, selectedNoteId, queueNoteSync, handlePermanentDelete, flushPendingUpdates, flushPendingSaves]
  );
  const handleRestoreNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      if (savePendingRef.current.size > 0) {
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
      void flushPendingSaves();
    },
    [selectedNoteId, queueNoteSync, flushPendingUpdates, flushPendingSaves]
  );
  const handleDuplicateNote = useCallback(
    async (noteToDupe?: Note, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (savePendingRef.current.size > 0) {
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
      unconfirmedCreatesRef.current.add(tempId);
      if (!token) {
        setSaveError('Not signed in — this note has not been saved.');
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
        unconfirmedCreatesRef.current.delete(tempId);
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
        queueNoteSync(tempId);
        setSaveError(
          `Could not duplicate note on the server — this change exists only on this device. ` +
            (err instanceof Error ? err.message : 'Unknown error')
        );
      }
    },
    [selectedNote, token, userId, userEmail, flushPendingUpdates, queueNoteSync]
  );
  const handleEmptyTrash = useCallback(async () => {
    if (
      !window.confirm('Permanently delete all notes in Recently Deleted? This cannot be undone.')
    ) {
      return;
    }
    setNotes((prev) => {
      // Record the deletions so an in-flight fetch cannot re-add them.
      prev
        .filter((n) => n.is_trashed)
        .forEach((n) => {
          locallyDeletedRef.current.add(n.id);
          savePendingRef.current.delete(n.id);
        });
      setUnsyncedCount(savePendingRef.current.size);
      return prev.filter((n) => !n.is_trashed);
    });
    setSelectedNoteId(null);
    if (!token) {
      setSaveError('Not signed in — the trash has not been emptied on the server.');
      return;
    }
    try {
      await emptyTrashAction(token);
    } catch (err) {
      console.error('Failed to empty trash on server:', err);
      setSaveError(
        'Could not empty trash on the server. ' +
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
              You are not signed in on this device, so your notes could not be loaded.
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
              {unsyncedCount} {unsyncedCount === 1 ? 'note has' : 'notes have'} unsaved
              changes.
            </span>
            <button
              type="button"
              className={styles.syncRetryBtn}
              onClick={() => void flushPendingSaves()}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save now'}
            </button>
          </div>
        )}
        {syncState === 'error' && (
          <div className={styles.syncBanner}>
            <span>
              Could not load your notes from storage.
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
