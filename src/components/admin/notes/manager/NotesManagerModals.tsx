'use client';
import React from 'react';
import { Note } from '../NotesTypes';
import { NotesLockModal } from '../NotesLockModal';
import { NotesBackupModal } from '../NotesBackupModal';
import { NotesSecurityModal } from '../NotesSecurityModal';
interface NotesManagerModalsProps {
  selectedNote: Note | null;
  isLockModalOpen: boolean;
  isBackupModalOpen: boolean;
  isSecurityModalOpen: boolean;
  storageProvider: 'vercel_blob' | 'database_fallback' | null;
  notes: Note[];
  folders: string[];
  token: string;
  userId: string;
  userEmail: string;
  onCloseLockModal: () => void;
  onCloseBackupModal: () => void;
  onCloseSecurityModal: () => void;
  onSetLockPassword: (hash: string) => void;
  onRemoveLock: () => void;
  onUnlockSuccess: () => void;
  onRestoreSuccess: (notes: Note[], folders: string[]) => void;
}
export const NotesManagerModals: React.FC<NotesManagerModalsProps> = ({
  selectedNote,
  isLockModalOpen,
  isBackupModalOpen,
  isSecurityModalOpen,
  storageProvider,
  notes,
  folders,
  token,
  userId,
  userEmail,
  onCloseLockModal,
  onCloseBackupModal,
  onCloseSecurityModal,
  onSetLockPassword,
  onRemoveLock,
  onUnlockSuccess,
  onRestoreSuccess,
}) => {
  return (
    <>
      {selectedNote && (
        <NotesLockModal
          isOpen={isLockModalOpen}
          isLocked={Boolean(selectedNote.is_locked)}
          hasPasswordHash={Boolean(selectedNote.lock_password_hash)}
          expectedHash={selectedNote.lock_password_hash}
          onClose={onCloseLockModal}
          onSetPassword={onSetLockPassword}
          onRemoveLock={onRemoveLock}
          onUnlockSuccess={onUnlockSuccess}
        />
      )}
      <NotesBackupModal
        isOpen={isBackupModalOpen}
        notes={notes}
        folders={folders}
        token={token}
        userId={userId}
        userEmail={userEmail}
        onClose={onCloseBackupModal}
        onRestoreSuccess={onRestoreSuccess}
      />
      <NotesSecurityModal
        isOpen={isSecurityModalOpen}
        storageProvider={storageProvider}
        onClose={onCloseSecurityModal}
      />
    </>
  );
};
