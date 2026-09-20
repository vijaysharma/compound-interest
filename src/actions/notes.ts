'use server';
import { NoteItem, CreateNoteInput, UpdateNoteInput, RestoreNotesBackupInput } from './notes/types';
import { handleGetNotes } from './notes/getNotesHandler';
import { handleCreateNote } from './notes/createNoteHandler';
import { handleUpdateNote } from './notes/updateNoteHandler';
import { handleDeleteNote, handleEmptyTrash } from './notes/deleteHandlers';
import { handleRestoreNotesBackup, handleGetNotesStorageStatus } from './notes/backupHandler';
export type { NoteItem };
export async function getNotesAction(
  options: { include_trashed?: boolean } = {},
  token?: string | null
): Promise<NoteItem[]> {
  return handleGetNotes(options, token);
}
export async function createNoteAction(
  body: CreateNoteInput,
  token?: string | null
): Promise<NoteItem> {
  return handleCreateNote(body, token);
}
export async function updateNoteAction(
  body: UpdateNoteInput,
  token?: string | null
): Promise<{
  success: boolean;
  id: string;
  rejected?: 'missing' | 'stale';
}> {
  return handleUpdateNote(body, token);
}
export async function deleteNoteAction(
  options: { id?: string; permanent?: boolean },
  token?: string | null
): Promise<{ success: boolean; trashed?: boolean; deleted?: boolean; message?: string }> {
  return handleDeleteNote(options, token);
}
export async function emptyTrashAction(
  token?: string | null
): Promise<{ success: boolean; count: number; message: string }> {
  return handleEmptyTrash(token);
}
export async function restoreNotesBackupAction(
  body: RestoreNotesBackupInput,
  token?: string | null
): Promise<{ success: boolean; count: number }> {
  return handleRestoreNotesBackup(body, token);
}
export async function getNotesStorageStatusAction(): Promise<{
  vercel_blob_enabled: boolean;
  storage_provider: string;
  message: string;
}> {
  return handleGetNotesStorageStatus();
}
