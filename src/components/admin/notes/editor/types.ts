import { Note } from '../NotesTypes';
export interface NotesEditorProps {
  note: Note | null;
  folders: string[];
  isSaving: boolean;
  onUpdateNote: (updated: Partial<Note>) => void;
  onTogglePin: () => void;
  onDeleteNote: () => void;
  onRestoreNote: () => void;
  onPermanentDelete: () => void;
  onNewNote: () => void;
  onOpenLockModal: () => void;
  onDuplicateNote: () => void;
  isUnlockedInSession: boolean;
  onUnlockSession: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onBackMobile?: () => void;
  onOpenBackupModal?: () => void;
  onOpenSecurityModal?: () => void;
  onCreateFolder?: (name: string) => void;
  folderTitle?: string;
  isMobileScreen?: boolean;
}
export type DropdownType = 'folder' | 'share' | 'format' | 'fontSize' | 'palette' | null;
export type MobileMenuType = 'format' | 'palette' | 'lists' | 'more' | null;
export type ViewportState = {
  height: number;
  offsetTop: number;
} | null;
