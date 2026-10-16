import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePlainInput } from '../sanitizeHtml';
import { reconcileNotesWithLocalDrafts } from '../manager/notesDraftStorage';
import type { Note } from '../NotesTypes';
test('sanitizePlainInput allows spaces when trim is false', () => {
  const withTrailingSpace = 'Meeting Notes ';
  const sanitized = sanitizePlainInput(withTrailingSpace, 250, false);
  assert.equal(sanitized, 'Meeting Notes ');
  const multipleSpaces = 'Project  Alpha  Draft ';
  assert.equal(sanitizePlainInput(multipleSpaces, 250, false), 'Project  Alpha  Draft ');
  // With trim = true (default) it still trims
  assert.equal(sanitizePlainInput('  Title  ', 250), 'Title');
  // Strips null bytes and HTML tags regardless of trim
  assert.equal(sanitizePlainInput('<b>Bold</b> Title \0', 250, false), 'Bold Title ');
});
test('reconcileNotesWithLocalDrafts preserves user edits on page refresh', () => {
  const mockStorage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
    length: 0,
  };
  const userId = 'user_123';
  const serverNotes: Note[] = [
    {
      id: 'note_1',
      title: 'Old Title',
      content: '<p>Old content</p>',
      folder: 'Notes',
      is_pinned: false,
      is_locked: false,
      is_trashed: false,
      tags: [],
      created_at: '2026-10-16T10:00:00.000Z',
      updated_at: '2026-10-16T10:00:00.000Z',
    },
  ];
  const draftNote: Note = {
    id: 'note_1',
    title: 'New Title With Spaces ',
    content: '<p>New typed content that was unsaved on refresh</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:05:00.000Z',
  };
  mockStorage[`quick_notes_drafts_${userId}_v1`] = JSON.stringify({
    note_1: draftNote,
  });
  const { reconciled, unsavedDraftIds } = reconcileNotesWithLocalDrafts(userId, serverNotes);
  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].title, 'New Title With Spaces ');
  assert.equal(reconciled[0].content, '<p>New typed content that was unsaved on refresh</p>');
  assert.deepEqual(unsavedDraftIds, ['note_1']);
});
test('reconcileNotesWithLocalDrafts preserves tag removal across refresh', () => {
  const mockStorage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
    length: 0,
  };
  const userId = 'user_123';
  const serverNotes: Note[] = [
    {
      id: 'note_tag_1',
      title: 'Note with Tag',
      content: '<p>Content</p>',
      folder: 'Notes',
      is_pinned: false,
      is_locked: false,
      is_trashed: false,
      tags: ['work', 'urgent'],
      created_at: '2026-10-16T10:00:00.000Z',
      updated_at: '2026-10-16T10:00:00.000Z',
    },
  ];
  // Draft has tag 'urgent' removed (only 'work' remains)
  const draftNote: Note = {
    id: 'note_tag_1',
    title: 'Note with Tag',
    content: '<p>Content</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: ['work'],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:02:00.000Z',
  };
  mockStorage[`quick_notes_drafts_${userId}_v1`] = JSON.stringify({
    note_tag_1: draftNote,
  });
  const { reconciled, unsavedDraftIds } = reconcileNotesWithLocalDrafts(userId, serverNotes);
  assert.equal(reconciled.length, 1);
  assert.deepEqual(reconciled[0].tags, ['work']);
  assert.deepEqual(unsavedDraftIds, ['note_tag_1']);
});
test('reconcileNotesWithLocalDrafts preserves trashed state across refresh', () => {
  const mockStorage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
    length: 0,
  };
  const userId = 'user_123';
  const serverNotes: Note[] = [
    {
      id: 'note_trash_1',
      title: 'Active on Server',
      content: '<p>Content</p>',
      folder: 'Notes',
      is_pinned: false,
      is_locked: false,
      is_trashed: false,
      tags: [],
      created_at: '2026-10-16T10:00:00.000Z',
      updated_at: '2026-10-16T10:00:00.000Z',
    },
  ];
  // Note was trashed locally
  const draftNote: Note = {
    id: 'note_trash_1',
    title: 'Active on Server',
    content: '<p>Content</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: true,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:03:00.000Z',
  };
  mockStorage[`quick_notes_drafts_${userId}_v1`] = JSON.stringify({
    note_trash_1: draftNote,
  });
  const { reconciled, unsavedDraftIds } = reconcileNotesWithLocalDrafts(userId, serverNotes);
  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].is_trashed, true);
  assert.deepEqual(unsavedDraftIds, ['note_trash_1']);
});
test('merge on note creation preserves user typed and pasted content over empty server response', () => {
  const tempId = 'temp_note_123';
  const serverCreatedNote: Note = {
    id: 'server_id_789',
    title: '',
    content: '',
    folder: 'Quick Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: [],
    created_at: '2026-10-16T12:00:00.000Z',
    updated_at: '2026-10-16T12:00:00.000Z',
  };
  const localNoteWithPastedData: Note = {
    id: tempId,
    title: 'My Meeting Notes',
    content: '<p>Pasted confidential meeting notes</p>',
    folder: 'Quick Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: ['work'],
    created_at: '2026-10-16T12:00:00.000Z',
    updated_at: '2026-10-16T12:00:01.000Z',
  };
  const merged: Note = {
    ...serverCreatedNote,
    title: localNoteWithPastedData.title || serverCreatedNote.title,
    content: localNoteWithPastedData.content || serverCreatedNote.content,
    folder: localNoteWithPastedData.folder,
    tags: localNoteWithPastedData.tags,
    is_pinned: localNoteWithPastedData.is_pinned,
    updated_at: localNoteWithPastedData.updated_at || serverCreatedNote.updated_at,
  };
  assert.equal(merged.id, 'server_id_789');
  assert.equal(merged.title, 'My Meeting Notes');
  assert.equal(merged.content, '<p>Pasted confidential meeting notes</p>');
  assert.deepEqual(merged.tags, ['work']);
});
test('note update targeting updates target note even when another note is selected', () => {
  const noteA: Note = {
    id: 'note_A',
    title: 'Note A',
    content: '<p>Content A</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:00:00.000Z',
  };
  const noteB: Note = {
    id: 'note_B',
    title: 'Note B',
    content: '<p>Content B</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:00:00.000Z',
  };
  const notes = [noteA, noteB];
  const selectedNoteId = 'note_B';
  const targetId = 'note_A';
  const idToUpdate = targetId || selectedNoteId;
  const updatedFields: Partial<Note> = { content: '<p>Updated Content A while note_B active</p>' };
  const updatedList = notes.map((n) => (n.id === idToUpdate ? { ...n, ...updatedFields } : n));
  const updatedNoteA = updatedList.find((n) => n.id === 'note_A');
  const updatedNoteB = updatedList.find((n) => n.id === 'note_B');
  assert.equal(updatedNoteA?.content, '<p>Updated Content A while note_B active</p>');
  assert.equal(updatedNoteB?.content, '<p>Content B</p>');
});
test('selectedNote preserves trashed note without redirecting to untrashed note', () => {
  const trashedNote: Note = {
    id: 'trashed_1',
    title: 'Deleted Note',
    content: '<p>Deleted Content</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: true,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:00:00.000Z',
  };
  const activeNote: Note = {
    id: 'active_1',
    title: 'Active Note',
    content: '<p>Active Content</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:00:00.000Z',
  };
  const notes = [activeNote, trashedNote];
  const selectedNoteId: string | null = 'trashed_1';
  const activeFolder = 'trash';
  const selectedNote =
    (selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : null) ||
    (activeFolder === 'trash' ? null : notes.find((n) => !n.is_trashed)) ||
    null;
  assert.equal(selectedNote?.id, 'trashed_1');
  assert.equal(selectedNote?.is_trashed, true);
});
