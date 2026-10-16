'use client';
import React from 'react';
import { Note } from '../NotesTypes';
import { NotesLockModal } from '../NotesLockModal';
import { NotesBackupModal } from '../NotesBackupModal';
import { NotesSecurityModal } from '../NotesSecurityModal';
import { UnsavedChangesModal } from '../editor/UnsavedChangesModal';
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
  isUnsavedChangesModalOpen?: boolean;
  onCloseUnsavedChangesModal?: () => void;
  onDiscardUnsavedChanges?: () => void;
  onSaveAndProceedUnsavedChanges?: () => void;
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
  isUnsavedChangesModalOpen,
  onCloseUnsavedChangesModal,
  onDiscardUnsavedChanges,
  onSaveAndProceedUnsavedChanges,
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
      <UnsavedChangesModal
        isOpen={Boolean(isUnsavedChangesModalOpen)}
        onClose={onCloseUnsavedChangesModal || (() => {})}
        onDiscard={onDiscardUnsavedChanges || (() => {})}
        onSaveAndProceed={onSaveAndProceedUnsavedChanges || (() => {})}
      />
    </>
  );
};
