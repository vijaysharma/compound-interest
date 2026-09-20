'use client';
import { useState } from 'react';
import { Note, SYSTEM_FOLDERS } from '../NotesTypes';
interface UseNotesFolderLockActionsProps {
  folders: string[];
  setFolders: React.Dispatch<React.SetStateAction<string[]>>;
  foldersKeyRef: React.MutableRefObject<string>;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  setMobileScreen: (s: 'folders' | 'list' | 'editor') => void;
  isMobile: boolean;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  queueNoteSync: (id: string) => void;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  handleUpdateNote: (fields: Partial<Note>) => void;
}
export function useNotesFolderLockActions({
  folders,
  setFolders,
  foldersKeyRef,
  activeFolder,
  setActiveFolder,
  setMobileScreen,
  isMobile,
  notes,
  setNotes,
  queueNoteSync,
  selectedNoteId,
  setSelectedNoteId,
  handleUpdateNote,
}: UseNotesFolderLockActionsProps) {
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set());
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const handleCreateFolder = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || folders.includes(cleanName)) return;
    const next = [...folders, cleanName];
    setFolders(next);
    localStorage.setItem(foldersKeyRef.current, JSON.stringify(next));
    setActiveFolder(cleanName);
    if (isMobile) setMobileScreen('list');
  };
  const handleRenameFolder = (oldName: string, newName: string) => {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanNew || cleanOld === cleanNew) return;
    const nextFolders = folders.map((f) => (f === cleanOld ? cleanNew : f));
    setFolders(nextFolders);
    localStorage.setItem(foldersKeyRef.current, JSON.stringify(nextFolders));
    if (activeFolder === cleanOld) setActiveFolder(cleanNew);
    setNotes((prev) => prev.map((n) => (n.folder === cleanOld ? { ...n, folder: cleanNew } : n)));
    notes.filter((n) => n.folder === cleanOld).forEach((n) => queueNoteSync(n.id));
  };
  const handleDeleteFolder = (name: string) => {
    const nextFolders = folders.filter((f) => f !== name);
    setFolders(nextFolders);
    localStorage.setItem(foldersKeyRef.current, JSON.stringify(nextFolders));
    if (activeFolder === name) setActiveFolder(SYSTEM_FOLDERS.ALL);
    setNotes((prev) => prev.map((n) => (n.folder === name ? { ...n, folder: 'Quick Notes' } : n)));
    notes.filter((n) => n.folder === name).forEach((n) => queueNoteSync(n.id));
  };
  const handleSetLockPassword = (hash: string) => {
    if (!selectedNoteId) return;
    handleUpdateNote({ is_locked: true, lock_password_hash: hash });
    setUnlockedNotes((prev) => new Set([...prev, selectedNoteId]));
  };
  const handleRemoveLock = () => {
    if (!selectedNoteId) return;
    handleUpdateNote({ is_locked: false, lock_password_hash: '' });
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
    if (first) setSelectedNoteId(first.id);
  };
  return {
    unlockedNotes,
    isLockModalOpen,
    setIsLockModalOpen,
    isBackupModalOpen,
    setIsBackupModalOpen,
    isSecurityModalOpen,
    setIsSecurityModalOpen,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleSetLockPassword,
    handleRemoveLock,
    handleUnlockSession,
    handleRestoreSuccess,
  };
}
