import { Note } from '../NotesTypes';
export interface NotesBackupModalProps {
  isOpen: boolean;
  notes: Note[];
  folders: string[];
  token: string;
  userId?: string;
  userEmail?: string;
  onClose: () => void;
  onRestoreSuccess: (restoredNotes: Note[], customFolders: string[]) => void;
}
export interface BackupPayload {
  app: string;
  version: number;
  exported_at: string;
  note_count: number;
  folders: string[];
  notes: Note[];
}
