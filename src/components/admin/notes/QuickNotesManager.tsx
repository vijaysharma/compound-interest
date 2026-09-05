import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NotesSidebar } from './NotesSidebar';
import { NotesList } from './NotesList';
import { NotesEditor } from './NotesEditor';
import { NotesLockModal } from './NotesLockModal';
import { NotesBackupModal } from './NotesBackupModal';
import { Note, ViewMode, SortOption, SYSTEM_FOLDERS, DEFAULT_CUSTOM_FOLDERS } from './NotesTypes';
import './quick-notes.css';
const LOCAL_STORAGE_CACHE_KEY = 'quick_notes_cache_v2';
const LOCAL_STORAGE_FOLDERS_KEY = 'quick_notes_custom_folders_v2';
export const QuickNotesManager: React.FC<{ token: string }> = ({ token }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [folders, setFolders] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_FOLDERS_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_CUSTOM_FOLDERS;
    } catch {
      return DEFAULT_CUSTOM_FOLDERS;
    }
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      const list = cached ? JSON.parse(cached) : [];
      const firstActive = list.find((n: Note) => !n.is_trashed);
      return firstActive ? firstActive.id : null;
    } catch {
      return null;
    }
  });
  const [activeFolder, setActiveFolder] = useState<string>(SYSTEM_FOLDERS.ALL);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [mobileScreen, setMobileScreen] = useState<'folders' | 'list' | 'editor'>('list');
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<{ id: string; updates: Partial<Note> } | null>(null);
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/admin/notes?include_trashed=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && isMounted) {
          const data = (await res.json()) as Note[];
          setNotes(data || []);
          localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(data || []));
          if (Array.isArray(data)) {
            const fetchedFolders = data.map((n) => n.folder).filter(Boolean);
            setFolders((prev) => {
              const combined = Array.from(new Set([...prev, ...fetchedFolders]));
              localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(combined));
              return combined;
            });
            setSelectedNoteId((curr) => {
              if (curr && data.some((n) => n.id === curr)) return curr;
              const firstActive = data.find((n) => !n.is_trashed);
              return firstActive ? firstActive.id : null;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token]);
  const effectiveNoteId = selectedNoteId || notes.find((n) => !n.is_trashed)?.id || null;
  const selectedNote = notes.find((n) => n.id === effectiveNoteId) || null;
  const persistNoteToServer = useCallback(
    async (noteId: string, updates: Partial<Note>) => {
      if (!token) return;
      setIsSaving(true);
      try {
        await fetch('/api/admin/notes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: noteId, ...updates }),
        });
      } catch (err) {
        console.error('Failed to save note:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [token]
  );
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
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
        return next;
      });
      pendingUpdatesRef.current = {
        id: selectedNoteId,
        updates: { ...(pendingUpdatesRef.current?.updates || {}), ...payload },
      };
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingUpdatesRef.current) {
          persistNoteToServer(pendingUpdatesRef.current.id, pendingUpdatesRef.current.updates);
          pendingUpdatesRef.current = null;
        }
      }, 500);
    },
    [selectedNoteId, persistNoteToServer]
  );
  const handleNewNote = useCallback(async () => {
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
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    setSelectedNoteId(tempId);
    setMobileScreen('editor');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: tempId,
          title: '',
          content: '',
          folder: targetFolder,
          tags: newNote.tags,
        }),
      });
      if (res.ok) {
        const created = (await res.json()) as Note;
        setNotes((prev) => {
          const next = prev.map((n) => (n.id === tempId ? created : n));
          localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
          return next;
        });
        setSelectedNoteId(created.id);
      }
    } catch (err) {
      console.error('Failed to create note on server:', err);
    }
  }, [activeFolder, activeTag, token]);
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
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
        return next;
      });
      persistNoteToServer(targetId, { is_pinned: newPinState, updated_at: updatedTime });
    },
    [notes, selectedNoteId, persistNoteToServer]
  );
  const handleDeleteNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const updatedTime = new Date().toISOString();
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === targetId ? { ...n, is_trashed: true, updated_at: updatedTime } : n
        );
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
        return next;
      });
      if (selectedNoteId === targetId) {
        const remaining = notes.filter((n) => n.id !== targetId && !n.is_trashed);
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        setMobileScreen('list');
      }
      persistNoteToServer(targetId, { is_trashed: true, updated_at: updatedTime });
    },
    [notes, selectedNoteId, persistNoteToServer]
  );
  const handleRestoreNote = useCallback(
    (id?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      const updatedTime = new Date().toISOString();
      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === targetId ? { ...n, is_trashed: false, updated_at: updatedTime } : n
        );
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
        return next;
      });
      persistNoteToServer(targetId, { is_trashed: false, updated_at: updatedTime });
    },
    [selectedNoteId, persistNoteToServer]
  );
  const handlePermanentDelete = useCallback(
    async (id?: string) => {
      const targetId = id || selectedNoteId;
      if (!targetId) return;
      if (!window.confirm('Are you sure you want to permanently delete this note?')) {
        return;
      }
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== targetId);
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
        return next;
      });
      if (selectedNoteId === targetId) {
        const remaining = notes.filter((n) => n.id !== targetId);
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        setMobileScreen('list');
      }
      if (!token) return;
      try {
        await fetch(`/api/admin/notes?id=${encodeURIComponent(targetId)}&permanent=true`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Failed to permanently delete note:', err);
      }
    },
    [notes, selectedNoteId, token]
  );
  const handleDuplicateNote = useCallback(
    async (noteToDupe?: Note, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
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
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
        return next;
      });
      setSelectedNoteId(tempId);
      setMobileScreen('editor');
      if (!token) return;
      try {
        const res = await fetch('/api/admin/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: tempId,
            title: duplicated.title,
            content: duplicated.content,
            folder: duplicated.folder,
            tags: duplicated.tags,
            is_pinned: false,
          }),
        });
        if (res.ok) {
          const created = (await res.json()) as Note;
          setNotes((prev) => {
            const next = prev.map((n) => (n.id === tempId ? created : n));
            localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
            return next;
          });
          setSelectedNoteId(created.id);
        }
      } catch (err) {
        console.error('Failed to duplicate note:', err);
      }
    },
    [selectedNote, token]
  );
  const handleEmptyTrash = useCallback(async () => {
    if (
      !window.confirm('Permanently delete all notes in Recently Deleted? This cannot be undone.')
    ) {
      return;
    }
    setNotes((prev) => {
      const next = prev.filter((n) => !n.is_trashed);
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
      return next;
    });
    if (!token) return;
    try {
      await fetch('/api/admin/notes?action=empty_trash', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to empty trash on server:', err);
    }
  }, [token]);
  const handleCreateFolder = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || folders.includes(cleanName)) return;
    const next = [...folders, cleanName];
    setFolders(next);
    localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(next));
    setActiveFolder(cleanName);
    setMobileScreen('list');
  };
  const handleRenameFolder = (oldName: string, newName: string) => {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanNew || cleanOld === cleanNew) return;
    const nextFolders = folders.map((f) => (f === cleanOld ? cleanNew : f));
    setFolders(nextFolders);
    localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(nextFolders));
    if (activeFolder === cleanOld) {
      setActiveFolder(cleanNew);
    }
    setNotes((prev) => {
      const nextNotes = prev.map((n) => (n.folder === cleanOld ? { ...n, folder: cleanNew } : n));
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(nextNotes));
      return nextNotes;
    });
    notes
      .filter((n) => n.folder === cleanOld)
      .forEach((n) => persistNoteToServer(n.id, { folder: cleanNew }));
  };
  const handleDeleteFolder = (name: string) => {
    const nextFolders = folders.filter((f) => f !== name);
    setFolders(nextFolders);
    localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(nextFolders));
    if (activeFolder === name) {
      setActiveFolder(SYSTEM_FOLDERS.ALL);
    }
    setNotes((prev) => {
      const nextNotes = prev.map((n) => (n.folder === name ? { ...n, folder: 'Quick Notes' } : n));
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(nextNotes));
      return nextNotes;
    });
    notes
      .filter((n) => n.folder === name)
      .forEach((n) => persistNoteToServer(n.id, { folder: 'Quick Notes' }));
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
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(restoredNotes));
    if (restoredFolders && restoredFolders.length > 0) {
      setFolders((prev) => {
        const combined = Array.from(new Set([...prev, ...restoredFolders]));
        localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(combined));
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
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(next));
        return next;
      });
      persistNoteToServer(noteId, { folder: targetFolder, updated_at: updatedTime });
    },
    [persistNoteToServer]
  );
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && (e.key === 'n' || e.key === 'N')) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          handleNewNote();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNewNote]);
  const trashedCount = notes.filter((n) => n.is_trashed).length;
  const isSelectedNoteUnlocked = selectedNoteId ? unlockedNotes.has(selectedNoteId) : false;
  return (
    <div className="relative flex-1 w-full h-full flex overflow-hidden quick-notes-theme">
      {loading && notes.length === 0 && (
        <div className="absolute inset-0 bg-base-100/80 backdrop-blur-xs flex items-center justify-center z-50">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      )}
      <div
        className={`h-full ${
          mobileScreen === 'folders'
            ? 'flex flex-1 w-full md:flex-none'
            : isSidebarOpen
              ? 'hidden md:flex'
              : 'hidden'
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
            setMobileScreen('list');
          }}
          onSelectTag={(t) => {
            setActiveTag(t);
            setMobileScreen('list');
          }}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          isOpen={isSidebarOpen || mobileScreen === 'folders'}
          onCloseMobile={() => setMobileScreen('list')}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onNewNote={handleNewNote}
          isMobileScreen={mobileScreen === 'folders'}
        />
      </div>
      <div
        className={`h-full ${
          mobileScreen === 'list'
            ? 'flex flex-1 w-full md:w-80 lg:w-88 md:flex-initial'
            : 'hidden md:flex'
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
          onSelectNote={(note) => {
            setSelectedNoteId(note.id);
            setMobileScreen('editor');
          }}
          onNewNote={handleNewNote}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onSortChange={setSortOption}
          onTogglePin={handleTogglePin}
          onDeleteNote={handleDeleteNote}
          onDuplicateNote={handleDuplicateNote}
          onRestoreNote={handleRestoreNote}
          onEmptyTrash={handleEmptyTrash}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          onCreateFolder={handleCreateFolder}
          onBackToFolders={() => setMobileScreen('folders')}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          isMobileScreen={mobileScreen === 'list'}
        />
      </div>
      <div
        className={`h-full flex-1 ${mobileScreen === 'editor' ? 'flex w-full' : 'hidden md:flex'}`}
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
          onCreateFolder={handleCreateFolder}
          folderTitle={activeFolder === SYSTEM_FOLDERS.ALL ? 'All Notes' : activeFolder}
          isMobileScreen={mobileScreen === 'editor'}
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
        onClose={() => setIsBackupModalOpen(false)}
        onRestoreSuccess={handleRestoreSuccess}
      />
    </div>
  );
};
export default QuickNotesManager;
