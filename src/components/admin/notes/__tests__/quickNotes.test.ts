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
  // Mock localStorage for test environment
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
  // Simulate local draft saved before refresh with latest edits
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
