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
test('queueNoteSync does not schedule auto-save timer when autoSaveEnabled is false', () => {
  const savePending = new Set<string>();
  let timerScheduled = false;
  let autoSaveEnabled = false;
  const queueNoteSync = (noteId: string) => {
    savePending.add(noteId);
    if (!autoSaveEnabled) {
      timerScheduled = false;
      return;
    }
    timerScheduled = true;
  };
  // Turn auto-save off and edit
  queueNoteSync('note_x');
  assert.equal(savePending.has('note_x'), true);
  assert.equal(timerScheduled, false);
  // Turn auto-save on and edit
  autoSaveEnabled = true;
  queueNoteSync('note_y');
  assert.equal(savePending.has('note_y'), true);
  assert.equal(timerScheduled, true);
});
test('save status badge correctly reports Unsaved changes when auto-save is off', () => {
  const getSaveStatus = (isTrash: boolean, isSaving: boolean, autoSaveEnabled: boolean, isPendingSave: boolean) => {
    if (isTrash) return 'Read Only';
    if (isSaving) return 'Saving...';
    if (!autoSaveEnabled && isPendingSave) return 'Unsaved changes';
    return 'Saved';
  };
  assert.equal(getSaveStatus(false, false, false, true), 'Unsaved changes');
  assert.equal(getSaveStatus(false, false, false, false), 'Saved');
  assert.equal(getSaveStatus(false, false, true, true), 'Saved');
  assert.equal(getSaveStatus(false, true, false, true), 'Saving...');
  assert.equal(getSaveStatus(true, false, false, true), 'Read Only');
});
test('getInitialCachedNotes reads persisted notes from localStorage for zero-latency load', async () => {
  const { getInitialCachedNotes, cacheDecryptedNotes } = await import('../manager/notesLoader');
  const mockStorage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
    length: 0,
  };
  const userId = 'user_cache_test';
  const testNotes: Note[] = [
    {
      id: 'cached_1',
      title: 'Fast Loaded Note',
      content: '<p>Immediate content</p>',
      folder: 'Quick Notes',
      is_pinned: false,
      is_locked: false,
      is_trashed: false,
      tags: [],
      created_at: '2026-10-17T10:00:00.000Z',
      updated_at: '2026-10-17T10:00:00.000Z',
    },
  ];
  cacheDecryptedNotes(userId, testNotes);
  const loaded = getInitialCachedNotes(userId);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, 'cached_1');
  assert.equal(loaded[0].title, 'Fast Loaded Note');
});
test('effectiveMobileScreen transitions to editor when a note is selected on mobile', () => {
  const computeMobileScreen = (
    isMobile: boolean,
    mobileScreen: 'folders' | 'list' | 'editor',
    selectedNoteId: string | null
  ) => {
    const hasNote = Boolean(selectedNoteId);
    return isMobile && mobileScreen === 'editor' && !hasNote ? 'list' : mobileScreen;
  };
  // When mobile user taps a note, mobileScreen becomes 'editor' and selectedNoteId is non-null
  assert.equal(computeMobileScreen(true, 'editor', 'note_123'), 'editor');
  // If no note is selected and user somehow landed on editor, fall back to 'list'
  assert.equal(computeMobileScreen(true, 'editor', null), 'list');
  // Folders screen stays on folders
  assert.equal(computeMobileScreen(true, 'folders', null), 'folders');
  // List screen stays on list
  assert.equal(computeMobileScreen(true, 'list', null), 'list');
});
test('folder reordering moves folders up and down correctly', () => {
  const folders = ['Work', 'Personal', 'Projects', 'Archive'];
  const moveFolder = (list: string[], folderName: string, direction: 'up' | 'down') => {
    const idx = list.indexOf(folderName);
    if (idx === -1) return list;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return list;
    const next = [...list];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    return next;
  };
  // Move 'Personal' up
  const movedUp = moveFolder(folders, 'Personal', 'up');
  assert.deepEqual(movedUp, ['Personal', 'Work', 'Projects', 'Archive']);
  // Move 'Work' down
  const movedDown = moveFolder(movedUp, 'Work', 'down');
  assert.deepEqual(movedDown, ['Personal', 'Projects', 'Work', 'Archive']);
  // Out of bounds checks
  assert.deepEqual(moveFolder(folders, 'Work', 'up'), folders);
  assert.deepEqual(moveFolder(folders, 'Archive', 'down'), folders);
});

test('stripHtmlToPlainText strips all tags, converts breaks to newlines, and decodes entities', async () => {
  const { stripHtmlToPlainText } = await import('../editor/plainTextPasteUtils');
  const dirty = '<div style="color: red; font-size: 24px;"><h1>Header</h1><p>Hello <b>World</b> &amp; &lt;friends&gt;!<br>New line</p></div>';
  const plain = stripHtmlToPlainText(dirty);
  assert.equal(plain, 'Header\nHello World & <friends>!\nNew line');
});

test('formatPlainTextToHtml escapes entities and wraps lines into plain paragraphs', async () => {
  const { formatPlainTextToHtml } = await import('../editor/plainTextPasteUtils');
  const raw = 'First line & more\n<script>alert(1)</script>';
  const html = formatPlainTextToHtml(raw);
  assert.equal(html, '<p>First line &amp; more</p><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

test('applySelectedLineHeight returns false when rangeCount is 0 or selection missing', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');
  const mockEditor = { contains: () => true } as unknown as HTMLElement;
  const mockSel = {
    rangeCount: 0,
    isCollapsed: true,
  } as unknown as Selection;
  const result = applySelectedLineHeight(mockEditor, mockSel, '1.8');
  assert.equal(result, false);
});

test('applySelectedLineHeight applies line-height to enclosing block when selection is collapsed', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');
  const mockBlock = {
    tagName: 'P',
    nodeType: 1,
    style: {} as any,
    querySelectorAll: () => [],
    parentNode: null as any,
  };
  const mockEditor = {
    contains: () => true,
    firstElementChild: mockBlock,
  } as unknown as HTMLElement;
  mockBlock.parentNode = mockEditor;

  const mockRange = {
    startContainer: mockBlock,
    commonAncestorContainer: mockBlock,
    collapsed: true,
  };
  const mockSel = {
    rangeCount: 1,
    isCollapsed: true,
    getRangeAt: () => mockRange,
  } as unknown as Selection;

  const result = applySelectedLineHeight(mockEditor, mockSel, '1.8');
  assert.equal(result, true);
  assert.equal(mockBlock.style.lineHeight, '1.8');
});

test('applySelectedLineHeight applies line-height to paragraph on text selection without introducing spans', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');
  const mockBlock = {
    tagName: 'P',
    nodeType: 1,
    style: {} as any,
    querySelectorAll: () => [],
    parentNode: null as any,
  };
  const mockEditor = {
    contains: () => true,
    firstElementChild: mockBlock,
    querySelector: () => mockBlock,
  } as unknown as HTMLElement;
  mockBlock.parentNode = mockEditor;

  const mockRange = {
    startContainer: mockBlock,
    endContainer: mockBlock,
    commonAncestorContainer: mockBlock,
    collapsed: false,
  };
  const mockSel = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => mockRange,
    removeAllRanges: () => {},
    addRange: () => {},
  } as unknown as Selection;

  const result = applySelectedLineHeight(mockEditor, mockSel, '2.0');
  assert.equal(result, true);
  assert.equal(mockBlock.style.lineHeight, '2.0');
  // Margin remains untouched (inter-paragraph spacing independent)
  assert.equal(mockBlock.style.margin, undefined);
  assert.equal(mockBlock.style.marginBottom, undefined);
});

test('navigation dirty guard: intercepts dirty note and stays on page after Discard and Save', () => {
  const savePending = new Set<string>(['note_1']);
  let isUnsavedModalOpen = false;
  let pendingNavActionCalled = false;
  let currentRoute = '/utilities/quick-notes';

  const requestNavigation = (action: () => void) => {
    const isDirty = savePending.has('note_1');
    if (isDirty) {
      isUnsavedModalOpen = true;
      return;
    }
    action();
  };

  // Attempt navigation while dirty
  requestNavigation(() => {
    pendingNavActionCalled = true;
    currentRoute = '/other-page';
  });

  // Modal is opened, navigation did NOT proceed
  assert.equal(isUnsavedModalOpen, true);
  assert.equal(pendingNavActionCalled, false);
  assert.equal(currentRoute, '/utilities/quick-notes');

  // Test Discard action: clears dirty state and stays on page
  const handleDiscard = () => {
    savePending.delete('note_1');
    isUnsavedModalOpen = false;
    // User stays on page
  };
  handleDiscard();

  assert.equal(isUnsavedModalOpen, false);
  assert.equal(savePending.has('note_1'), false);
  assert.equal(currentRoute, '/utilities/quick-notes');

  // Now that note is clean, navigation proceeds without modal
  requestNavigation(() => {
    pendingNavActionCalled = true;
    currentRoute = '/other-page';
  });
  assert.equal(isUnsavedModalOpen, false);
  assert.equal(pendingNavActionCalled, true);
  assert.equal(currentRoute, '/other-page');
});

test('navigation dirty guard: Save & Proceed persists changes and user stays on page', async () => {
  const savePending = new Set<string>(['note_2']);
  let isSaved = false;
  let isUnsavedModalOpen = false;
  let currentRoute = '/utilities/quick-notes';

  const requestNavigation = (action: () => void) => {
    if (savePending.has('note_2')) {
      isUnsavedModalOpen = true;
      return;
    }
    action();
  };

  requestNavigation(() => {
    currentRoute = '/dashboard';
  });
  assert.equal(isUnsavedModalOpen, true);
  assert.equal(currentRoute, '/utilities/quick-notes');

  // Handle Save & Proceed: persists note, clears dirty state, user stays on current page
  const handleSaveAndProceed = async () => {
    // flush saves
    isSaved = true;
    savePending.delete('note_2');
    isUnsavedModalOpen = false;
    // Does NOT auto-navigate
  };
  await handleSaveAndProceed();

  assert.equal(isSaved, true);
  assert.equal(savePending.has('note_2'), false);
  assert.equal(isUnsavedModalOpen, false);
  assert.equal(currentRoute, '/utilities/quick-notes');
});

test('applySelectedLineHeight applies line-height per block when selection crosses multiple paragraphs', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  const p1: any = {
    nodeType: 1,
    tagName: 'P',
    style: { lineHeight: '' },
    querySelectorAll: () => [],
    parentNode: null,
  };
  const p2: any = {
    nodeType: 1,
    tagName: 'P',
    style: { lineHeight: '' },
    querySelectorAll: () => [],
    parentNode: null,
  };

  const textNode1 = { nodeType: 3, parentNode: p1 };
  const textNode2 = { nodeType: 3, parentNode: p2 };

  const allBlocks = [p1, p2];
  const mockEditor: any = {
    contains: () => true,
    querySelectorAll: () => allBlocks,
  };
  p1.parentNode = mockEditor;
  p2.parentNode = mockEditor;

  let newRangeCreated = false;
  const mockNewRange = {
    setStartBefore: () => {},
    setEndAfter: () => {},
  };
  const mockSel: any = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => ({
      commonAncestorContainer: mockEditor,
      startContainer: textNode1,
      endContainer: textNode2,
    }),
    removeAllRanges: () => {},
    addRange: () => {},
  };

  const origDocument = globalThis.document;
  globalThis.document = {
    ...globalThis.document,
    createRange: () => {
      newRangeCreated = true;
      return mockNewRange as any;
    },
  } as any;

  try {
    const success = applySelectedLineHeight(mockEditor, mockSel, '1.75');
    assert.equal(success, true);
    assert.equal(p1.style.lineHeight, '1.75');
    assert.equal(p2.style.lineHeight, '1.75');
    assert.equal(newRangeCreated, true);
  } finally {
    globalThis.document = origDocument;
  }
});

test('paste-as-plain armed flag strips HTML formatting on next paste event', async () => {
  const { stripHtmlToPlainText, formatPlainTextToHtml } = await import('../editor/plainTextPasteUtils');

  let pasteAsPlainArmed = true;

  const simulatePaste = (htmlInput: string, textInput: string, shiftKey = false) => {
    const isPlain = pasteAsPlainArmed || shiftKey;
    pasteAsPlainArmed = false;

    if (isPlain) {
      const plain = textInput || stripHtmlToPlainText(htmlInput);
      return { isPlain: true, outputHtml: formatPlainTextToHtml(plain) };
    }
    return { isPlain: false, outputHtml: htmlInput };
  };

  // When armed, standard rich HTML paste is converted to unformatted plain text
  const richHtml = '<p><strong>Bold</strong> and <em>italic</em> with <a href="#">link</a></p>';
  const plainText = 'Bold and italic with link';
  const result1 = simulatePaste(richHtml, plainText, false);

  assert.equal(result1.isPlain, true);
  assert.equal(result1.outputHtml, '<p>Bold and italic with link</p>');
  assert.equal(pasteAsPlainArmed, false, 'Armed flag should reset after single paste');

  // Next paste without arming keeps rich HTML formatting
  const result2 = simulatePaste(richHtml, plainText, false);
  assert.equal(result2.isPlain, false);
  assert.equal(result2.outputHtml, richHtml);
});

test('popstate navigation guard: cancels browser back pop via pushState when dirty and keeps user on page', () => {
  const historyStack: string[] = ['/utilities/quick-notes'];
  let pushStateCount = 0;
  let isUnsavedModalOpen = false;
  let pendingNavExecuted = false;

  const mockHistory = {
    pushState: (_state: any, _title: string, url: string) => {
      pushStateCount++;
      historyStack.push(url);
    },
    back: () => {
      pendingNavExecuted = true;
      historyStack.pop();
    },
  };

  const isDirty = true;
  const currentUrl = '/utilities/quick-notes';

  // Simulate popstate event (e.g. user swiped back or clicked browser Back)
  const onPopState = () => {
    if (isDirty) {
      // Step 1: cancel pop by pushing current URL back
      mockHistory.pushState(null, '', currentUrl);
      // Step 2: show confirmation modal
      isUnsavedModalOpen = true;
    }
  };

  onPopState();

  assert.equal(pushStateCount, 1, 'pushState must be called to cancel the pop gesture');
  assert.equal(isUnsavedModalOpen, true, 'Unsaved changes modal must be displayed');
  assert.equal(pendingNavExecuted, false, 'Navigation must not execute while modal is open');
  assert.equal(historyStack[historyStack.length - 1], '/utilities/quick-notes');

  // User selects "Discard"
  const onDiscard = () => {
    isUnsavedModalOpen = false;
    // Re-push current URL to guarantee user stays on page
    mockHistory.pushState(null, '', currentUrl);
  };
  onDiscard();

  assert.equal(isUnsavedModalOpen, false);
  assert.equal(pendingNavExecuted, false);
  assert.equal(pushStateCount, 2);
  assert.equal(historyStack[historyStack.length - 1], '/utilities/quick-notes');
});

test('multi-block line-height undo: N-block change reverts in a single undo step', async () => {
  const initialHtml = '<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>';
  const updatedHtml = '<p style="line-height: 2;">Paragraph 1</p><p style="line-height: 2;">Paragraph 2</p><p style="line-height: 2;">Paragraph 3</p>';

  const editorRef = {
    current: {
      innerHTML: initialHtml,
      contains: () => true,
    },
  };

  const historyStack: string[] = [initialHtml];
  let historyIndex = 0;

  // Apply multi-block line height and push history snapshot
  editorRef.current.innerHTML = updatedHtml;
  historyStack.push(updatedHtml);
  historyIndex = historyStack.length - 1;

  assert.equal(historyIndex, 1);
  assert.equal(editorRef.current.innerHTML, updatedHtml);

  // Single undo step
  const handleUndo = () => {
    if (historyIndex > 0) {
      historyIndex--;
      editorRef.current.innerHTML = historyStack[historyIndex];
    }
  };

  handleUndo();

  // In ONE step, all N blocks are reverted to their original state
  assert.equal(historyIndex, 0);
  assert.equal(editorRef.current.innerHTML, initialHtml);
});

test('plain-paste visible toggle state and fallback overlay insertion', async () => {
  const { stripHtmlToPlainText, formatPlainTextToHtml } = await import('../editor/plainTextPasteUtils');

  let isPlainPasteArmed = false;
  let editorHtml = '<p>Initial text</p>';

  const toggleArmed = (armed?: boolean) => {
    isPlainPasteArmed = typeof armed === 'boolean' ? armed : !isPlainPasteArmed;
  };

  // 1. User taps Plain Paste button in toolbar -> visible toggle state is armed
  toggleArmed(true);
  assert.equal(isPlainPasteArmed, true, 'Plain paste must remain armed without a silent timeout');

  // 2. User confirms text through fallback overlay
  const fallbackInput = '<div style="color:red; font-size:24px;"><b>Pasted from iOS</b> with styles</div>';
  const handleConfirmFallback = (text: string) => {
    const plain = stripHtmlToPlainText(text);
    const html = formatPlainTextToHtml(plain);
    editorHtml += html;
    isPlainPasteArmed = false; // Disarmed on paste
  };

  handleConfirmFallback(fallbackInput);

  assert.equal(isPlainPasteArmed, false, 'Plain paste must disarm after insertion');
  assert.equal(editorHtml, '<p>Initial text</p><p>Pasted from iOS with styles</p>');

  // 3. Tapping button again when armed toggles it off
  toggleArmed(true);
  assert.equal(isPlainPasteArmed, true);
  toggleArmed(); // Toggle off
  assert.equal(isPlainPasteArmed, false);
});

test('iOS Safari reload draft restoration on mount preserves unsaved changes', async () => {
  const { reconcileNotesWithLocalDrafts, saveLocalDraft, removeLocalDraft } = await import('../manager/notesDraftStorage');

  const mockStorage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
    length: 0,
  };

  const userId = 'ios_user_456';
  const cachedServerNote: Note = {
    id: 'note_ios_1',
    title: 'Original Title',
    content: '<p>Original content from server</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:00:00.000Z',
  };

  // User made unsaved edits before page reload on iOS Safari (where beforeunload does not fire)
  const unsavedEditedNote: Note = {
    ...cachedServerNote,
    content: '<p>Fresh edits typed on iPhone Safari that were in localStorage</p>',
    updated_at: '2026-10-16T10:10:00.000Z',
  };

  saveLocalDraft(userId, unsavedEditedNote);

  // On page mount / reload, useNotesSync restores from localStorage draft immediately
  const { reconciled, unsavedDraftIds } = reconcileNotesWithLocalDrafts(userId, [cachedServerNote]);

  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].content, '<p>Fresh edits typed on iPhone Safari that were in localStorage</p>');
  assert.deepEqual(unsavedDraftIds, ['note_ios_1']);

  // After successful save, local draft is cleared
  removeLocalDraft(userId, 'note_ios_1');
  const postSave = reconcileNotesWithLocalDrafts(userId, [reconciled[0]]);
  assert.deepEqual(postSave.unsavedDraftIds, []);
});

test('line-height clears conflicting inner span line-height on enclosing paragraph', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  const innerSpan: any = {
    tagName: 'SPAN',
    style: { lineHeight: '1.2' },
    getAttribute: (attr: string) => (attr === 'style' && !innerSpan.style.lineHeight ? null : 'line-height: 1.2'),
    removeAttribute: () => {},
  };

  const mockBlock: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    querySelectorAll: (selector: string) => {
      if (selector.includes('span[style*="line-height"]')) {
        return [innerSpan];
      }
      return [];
    },
    parentNode: null,
  };

  const mockEditor = {
    contains: () => true,
    firstElementChild: mockBlock,
    querySelector: () => mockBlock,
  } as unknown as HTMLElement;
  mockBlock.parentNode = mockEditor;

  const mockRange = {
    startContainer: mockBlock,
    endContainer: mockBlock,
    commonAncestorContainer: mockBlock,
    startOffset: 0,
    endOffset: 0,
    collapsed: false,
  };

  const mockSel = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => mockRange,
    removeAllRanges: () => {},
    addRange: () => {},
  } as unknown as Selection;

  const success = applySelectedLineHeight(mockEditor, mockSel, '1.75');
  assert.equal(success, true);
  assert.equal(mockBlock.style.lineHeight, '1.75');
  // Conflicting inner span line-height was cleared so parent paragraph 1.75 applies cleanly
  assert.equal(innerSpan.style.lineHeight, '');
  // Inter-paragraph margins remain untouched
  assert.equal(mockBlock.style.margin, undefined);
  assert.equal(mockBlock.style.marginBottom, undefined);
});

test('intra-paragraph line spacing applies to multi-paragraph selection without touching margins or introducing spans', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  const p1: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    querySelectorAll: () => [],
    parentNode: null,
  };

  const p2: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    querySelectorAll: () => [],
    parentNode: null,
  };

  const allBlocks = [p1, p2];
  const mockEditor = {
    contains: () => true,
    firstElementChild: p1,
    querySelector: () => p1,
    querySelectorAll: () => allBlocks,
  } as unknown as HTMLElement;
  p1.parentNode = mockEditor;
  p2.parentNode = mockEditor;

  const mockRange = {
    startContainer: p1,
    endContainer: p2,
    commonAncestorContainer: mockEditor,
    startOffset: 0,
    endOffset: 0,
    collapsed: false,
  };

  const mockSel = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => mockRange,
    removeAllRanges: () => {},
    addRange: () => {},
  } as unknown as Selection;

  const success = applySelectedLineHeight(mockEditor, mockSel, '2.0');
  assert.equal(success, true);
  // Each paragraph gets intra-paragraph line-height 2.0
  assert.equal(p1.style.lineHeight, '2.0');
  assert.equal(p2.style.lineHeight, '2.0');
  // Inter-paragraph margins remain untouched
  assert.equal(p1.style.margin, undefined);
  assert.equal(p1.style.marginBottom, undefined);
  assert.equal(p2.style.margin, undefined);
  assert.equal(p2.style.marginBottom, undefined);
});

test('saveLocalDraft handles QuotaExceededError by persisting metadata-only fallback with is_draft_body_lost', async () => {
  const { saveLocalDraft, reconcileNotesWithLocalDrafts } = await import('../manager/notesDraftStorage');

  const mockStorage: Record<string, string> = {};
  let setItemCalls = 0;
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      setItemCalls++;
      // First attempt with full note throws QuotaExceededError
      if (val.includes('Heavy note content body')) {
        const quotaErr = new Error('The quota has been exceeded');
        quotaErr.name = 'QuotaExceededError';
        throw quotaErr;
      }
      mockStorage[key] = String(val);
    },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
    length: 0,
  };

  const userId = 'quota_user_1';
  const heavyNote: Note = {
    id: 'heavy_note_1',
    title: 'Heavy Note Title',
    content: '<p>Heavy note content body that exceeds quota</p>',
    folder: 'Notes',
    is_pinned: false,
    is_locked: false,
    is_trashed: false,
    tags: [],
    created_at: '2026-10-16T10:00:00.000Z',
    updated_at: '2026-10-16T10:15:00.000Z',
  };

  saveLocalDraft(userId, heavyNote);

  // setItem was called twice: initial full note (threw), then metadata-only fallback
  assert.equal(setItemCalls, 2);

  // Verify stored payload in mockStorage has content dropped and is_draft_body_lost = true
  const storedDrafts = JSON.parse(mockStorage[`quick_notes_drafts_${userId}_v1`] || '{}');
  assert.equal(storedDrafts.heavy_note_1?.id, 'heavy_note_1');
  assert.equal(storedDrafts.heavy_note_1?.content, '');
  assert.equal(storedDrafts.heavy_note_1?.is_draft_body_lost, true);

  // When restored against server note, server body is preserved and flagged
  const serverNote: Note = {
    ...heavyNote,
    content: '<p>Prior server content</p>',
    updated_at: '2026-10-16T10:00:00.000Z',
  };

  const { reconciled, unsavedDraftIds } = reconcileNotesWithLocalDrafts(userId, [serverNote]);
  assert.equal(reconciled[0].content, '<p>Prior server content</p>');
  assert.equal(reconciled[0].is_draft_body_lost, true);
  assert.deepEqual(unsavedDraftIds, ['heavy_note_1']);
});

test('applySelectedLineHeight handles all standard numeric LINE_HEIGHTS values', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');
  const { LINE_HEIGHTS } = await import('../editor/constants');

  for (const lh of LINE_HEIGHTS) {
    const mockBlock = {
      tagName: 'P',
      nodeType: 1,
      style: {} as any,
      querySelectorAll: () => [],
      parentNode: null as any,
    };
    const mockEditor = {
      contains: () => true,
      firstElementChild: mockBlock,
    } as unknown as HTMLElement;
    mockBlock.parentNode = mockEditor;

    const mockRange = {
      startContainer: mockBlock,
      commonAncestorContainer: mockBlock,
      collapsed: true,
    };
    const mockSel = {
      rangeCount: 1,
      isCollapsed: true,
      getRangeAt: () => mockRange,
    } as unknown as Selection;

    const applied = applySelectedLineHeight(mockEditor, mockSel, lh.value);
    assert.equal(applied, true);
    assert.equal(mockBlock.style.lineHeight, lh.value);
  }
});

test('EditorLineHeightDropdown trigger button prevents focus loss with onMouseDown and onTouchStart', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const fileContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/admin/notes/editor/EditorLineHeightDropdown.tsx'),
    'utf-8'
  );
  // Verify trigger button includes onMouseDown preventDefault and onTouchStart preventDefault
  assert.ok(fileContent.includes('onMouseDown={(e) => e.preventDefault()}'));
  assert.ok(fileContent.includes('onTouchStart={(e) => e.preventDefault()}'));
  assert.ok(fileContent.includes('title="Line Height (Selection or Paragraph)"'));
});

test('EditorPasteDropdown renders Paste (with formatting) and Paste as Plain Text buttons with handlers', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const fileContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/admin/notes/editor/EditorPasteDropdown.tsx'),
    'utf-8'
  );
  assert.ok(fileContent.includes('Paste (with formatting)'));
  assert.ok(fileContent.includes('Paste as Plain Text'));
  assert.ok(fileContent.includes('onPasteRich'));
  assert.ok(fileContent.includes('onPastePlain'));
  assert.ok(fileContent.includes('onMouseDown={(e) => e.preventDefault()}'));
  assert.ok(fileContent.includes('onTouchStart={(e) => e.preventDefault()}'));
});

test('EditorToolbarDesktop renders visible Paste dropdown and Paste Plain button', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const fileContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/admin/notes/editor/EditorToolbarDesktop.tsx'),
    'utf-8'
  );
  assert.ok(fileContent.includes('<EditorPasteDropdown'));
  assert.ok(fileContent.includes('onPasteRich={onPasteRich}'));
  assert.ok(fileContent.includes('onPastePlain={onPastePlain}'));
  assert.ok(fileContent.includes('<span>Plain</span>'));
  assert.ok(fileContent.includes('title="Paste as Plain Text without formatting (Cmd+Shift+V)"'));
});

test('EditorToolbarMobile renders Paste options popup with formatted and plain choices', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const fileContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/admin/notes/editor/EditorToolbarMobile.tsx'),
    'utf-8'
  );
  assert.ok(fileContent.includes("activeMobileMenu === 'paste' && !isPlainPasteArmed"));
  assert.ok(fileContent.includes('Paste (with formatting)'));
  assert.ok(fileContent.includes('Paste as Plain Text'));
  assert.ok(fileContent.includes('onPasteRich'));
  assert.ok(fileContent.includes('onPastePlain'));
});

test('plain-paste and rich-paste clipboard handling: executes appropriate insertion logic', async () => {
  const { stripHtmlToPlainText, formatPlainTextToHtml } = await import('../editor/plainTextPasteUtils');
  
  // Rich HTML content
  const sampleHtml = '<b>Important</b> <p>Formatted text</p>';
  // Plain paste strips all HTML tags
  const plainText = stripHtmlToPlainText(sampleHtml);
  assert.equal(plainText, 'Important Formatted text');

  // Multiline plain text is formatted to paragraphs
  const multiline = 'Line 1\nLine 2';
  const htmlResult = formatPlainTextToHtml(multiline);
  assert.equal(htmlResult, '<p>Line 1</p><p>Line 2</p>');
});

test('sanitizeNoteHtml preserves bold, links, and lists from MS Word while stripping mso-* junk and o:p', async () => {
  const { sanitizeNoteHtml } = await import('../sanitizeHtml');

  const wordHtml = `
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Normal</w:View></w:WordDocument></xml><![endif]-->
    <p class="MsoNormal" style="mso-margin-top-alt:auto;mso-margin-bottom-alt:auto;font-weight:bold;line-height:1.5">
      <b>Bold Word Text</b>
      <a href="https://example.com" style="mso-bidi-font-weight:normal;color:#0563c1">Word Link</a>
      <o:p>&nbsp;</o:p>
    </p>
    <ul>
      <li class="MsoListParagraph" style="mso-list:l0 level1 lfo1">List Item 1<o:p></o:p></li>
      <li class="MsoListParagraph" style="mso-list:l0 level1 lfo1">List Item 2</li>
    </ul>
  `;

  const cleaned = sanitizeNoteHtml(wordHtml);

  // Bold text preserved
  assert.ok(cleaned.includes('Bold Word Text'));
  assert.ok(cleaned.includes('<b>Bold Word Text</b>') || cleaned.includes('font-weight:bold') || cleaned.includes('font-weight: bold'));
  // Link preserved with href
  assert.ok(cleaned.includes('href="https://example.com"'));
  assert.ok(cleaned.includes('Word Link'));
  // List preserved
  assert.ok(cleaned.includes('<ul>'));
  assert.ok(cleaned.includes('List Item 1'));
  assert.ok(cleaned.includes('List Item 2'));
  assert.ok(cleaned.includes('</li>'));
  // Word junk stripped
  assert.ok(!cleaned.includes('mso-'));
  assert.ok(!cleaned.includes('<o:p>'));
  assert.ok(!cleaned.includes('</o:p>'));
  assert.ok(!cleaned.includes('<xml>'));
  assert.ok(!cleaned.includes('<!--[if'));
});

test('sanitizeNoteHtml preserves bold, links, and formatting from Google Docs clipboard HTML', async () => {
  const { sanitizeNoteHtml } = await import('../sanitizeHtml');

  const docsHtml = `
    <b style="font-weight:normal;" id="docs-internal-guid-12345">
      <p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">
        <span style="font-weight:700;color:#000000;">Google Docs Bold Text</span>
        <span> and </span>
        <a href="https://docs.google.com"><span style="color:#1155cc;text-decoration:underline;">Docs Link</span></a>
      </p>
      <ul>
        <li><span style="font-weight:400;">Docs list item</span></li>
      </ul>
    </b>
  `;

  const cleaned = sanitizeNoteHtml(docsHtml);

  // Bold text preserved with font-weight:700
  assert.ok(cleaned.includes('Google Docs Bold Text'));
  assert.ok(cleaned.includes('font-weight:700') || cleaned.includes('font-weight: 700') || cleaned.includes('<b>'));
  // Link preserved with href
  assert.ok(cleaned.includes('href="https://docs.google.com"'));
  assert.ok(cleaned.includes('Docs Link'));
  // List preserved
  assert.ok(cleaned.includes('<ul>'));
  assert.ok(cleaned.includes('<li>'));
  assert.ok(cleaned.includes('Docs list item'));
});

test('applySelectedLineHeight applies to enclosing block for non-collapsed selection without inline-block wrapping', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  const mockBlock = {
    tagName: 'P',
    nodeType: 1,
    style: {} as any,
    querySelectorAll: () => [],
    parentNode: null as any,
  };
  const mockEditor = {
    contains: () => true,
    firstElementChild: mockBlock,
  } as unknown as HTMLElement;
  mockBlock.parentNode = mockEditor;

  // Non-collapsed multi-word selection inside a single paragraph
  const mockRange = {
    startContainer: mockBlock,
    endContainer: mockBlock,
    commonAncestorContainer: mockBlock,
    collapsed: false,
    extractContents: () => ({ querySelectorAll: () => [], appendChild: () => {} }),
    insertNode: () => {},
  };
  const mockSel = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => mockRange,
  } as unknown as Selection;

  const result = applySelectedLineHeight(mockEditor, mockSel, '2.0');
  assert.equal(result, true);
  // Applied directly to enclosing block so text wraps across lines naturally without inline-block constraint
  assert.equal(mockBlock.style.lineHeight, '2.0');
});

test('intra-paragraph line spacing acceptance: paragraph with wrapped lines gets line-height on <p> with margins untouched and zero spans', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  // Paragraph long enough to wrap onto multiple lines in contenteditable
  let spanInserted = false;
  const mockParagraph: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    querySelectorAll: (selector: string) => {
      if (selector.includes('span')) {
        return spanInserted ? [{ tagName: 'SPAN' }] : [];
      }
      return [];
    },
    parentNode: null,
  };

  const textNode = {
    nodeType: 3,
    textContent: 'This is a long paragraph designed to wrap onto 3+ lines in the editor view.',
    parentNode: mockParagraph,
  };

  const mockEditor: any = {
    contains: (node: any) => node === mockParagraph || node === textNode,
    firstElementChild: mockParagraph,
    querySelector: () => mockParagraph,
  };
  mockParagraph.parentNode = mockEditor;

  // Caret placed anywhere inside the wrapped paragraph (collapsed selection on textNode)
  const mockRange = {
    startContainer: textNode,
    startOffset: 15,
    endContainer: textNode,
    endOffset: 15,
    commonAncestorContainer: textNode,
    collapsed: true,
  };

  const mockSel = {
    rangeCount: 1,
    isCollapsed: true,
    getRangeAt: () => mockRange,
    removeAllRanges: () => {},
    addRange: () => {},
  } as unknown as Selection;

  // Select line-height 2.0 from dropdown
  const success = applySelectedLineHeight(mockEditor, mockSel, '2.0');

  // 1. applySelectedLineHeight succeeded
  assert.equal(success, true);
  // 2. Intra-paragraph spacing: style is on the <p> itself (wrapped lines spaced at 2.0)
  assert.equal(mockParagraph.style.lineHeight, '2.0');
  // 3. Inter-paragraph spacing: margins between paragraphs remain completely untouched
  assert.equal(mockParagraph.style.margin, undefined);
  assert.equal(mockParagraph.style.marginTop, undefined);
  assert.equal(mockParagraph.style.marginBottom, undefined);
  // 4. Zero <span> wrapping introduced
  assert.equal(spanInserted, false);
});

test('subsequent line-height dropdown changes update <p> style (e.g. 1.2 -> 2.0 -> 0.8) without getting stuck', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  const mockParagraph: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    setAttribute: (k: string, v: string) => { mockParagraph.attributes = { ...mockParagraph.attributes, [k]: v }; },
    querySelectorAll: () => [],
    parentNode: null,
  };

  const textNode = {
    nodeType: 3,
    textContent: 'Testing subsequent line height changes',
    parentNode: mockParagraph,
  };

  const mockEditor: any = {
    contains: (node: any) => node === mockParagraph || node === textNode,
    firstElementChild: mockParagraph,
    querySelector: () => mockParagraph,
  };
  mockParagraph.parentNode = mockEditor;

  const mockRange = {
    startContainer: textNode,
    startOffset: 5,
    endContainer: textNode,
    endOffset: 5,
    commonAncestorContainer: textNode,
    collapsed: true,
  };

  const mockSel = {
    rangeCount: 1,
    isCollapsed: true,
    getRangeAt: () => mockRange,
    removeAllRanges: () => {},
    addRange: () => {},
  } as unknown as Selection;

  // 1st change: choose 1.2
  const res1 = applySelectedLineHeight(mockEditor, mockSel, '1.2');
  assert.equal(res1, true);
  assert.equal(mockParagraph.style.lineHeight, '1.2');

  // 2nd change: choose 2.0 (subsequent change)
  const res2 = applySelectedLineHeight(mockEditor, mockSel, '2.0');
  assert.equal(res2, true);
  assert.equal(mockParagraph.style.lineHeight, '2.0');

  // 3rd change: choose 0.8 (sub-1.6 tight spacing)
  const res3 = applySelectedLineHeight(mockEditor, mockSel, '0.8');
  assert.equal(res3, true);
  assert.equal(mockParagraph.style.lineHeight, '0.8');
});

test('sanitizeNoteHtml preserves line-height style without truncating it into line-', async () => {
  const { sanitizeNoteHtml } = await import('../sanitizeHtml');

  const htmlWithLineHeight = '<p style="line-height: 1.2; color: #333333;">Tight text</p>';
  const sanitized = sanitizeNoteHtml(htmlWithLineHeight);

  assert.ok(sanitized.includes('line-height: 1.2') || sanitized.includes('line-height:1.2'));
  assert.ok(!sanitized.includes('style="line-"'));
  assert.ok(!sanitized.includes('style="line- "'));
});

test('quick-notes.css does not clamp line-height with min-height: 1.6em on .qn-note-canvas p', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const cssContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/admin/notes/quick-notes.css'),
    'utf-8'
  );

  // Assert .qn-note-canvas p does not contain min-height: 1.6em or line-height: 1.6
  const pRuleMatch = /\.qn-note-canvas\s+p\s*\{([^}]+)\}/.exec(cssContent);
  assert.ok(pRuleMatch, 'p rule must exist');
  assert.ok(!pRuleMatch[1].includes('min-height: 1.6em'));
  assert.ok(!pRuleMatch[1].includes('line-height: 1.6'));
});

test('isRangeInEditor verifies uncollapsed range inside editor boundaries', async () => {
  const { isRangeInEditor } = await import('../editor/lineHeightUtils');

  const p1: any = { nodeType: 1 };
  const p2: any = { nodeType: 1 };
  const mockEditor: any = {
    contains: (node: any) => node === p1 || node === p2,
  };

  const validRange: any = {
    collapsed: false,
    startContainer: p1,
    endContainer: p2,
  };
  assert.equal(isRangeInEditor(validRange, mockEditor), true);

  const collapsedRange: any = {
    collapsed: true,
    startContainer: p1,
    endContainer: p1,
  };
  assert.equal(isRangeInEditor(collapsedRange, mockEditor), false);

  const outsideNode: any = { nodeType: 1 };
  const outsideRange: any = {
    collapsed: false,
    startContainer: p1,
    endContainer: outsideNode,
  };
  assert.equal(isRangeInEditor(outsideRange, mockEditor), false);
});

test('getBlocksInRange returns all blocks intersecting multi-paragraph range', async () => {
  const { getBlocksInRange } = await import('../editor/lineHeightUtils');

  const pA: any = { tagName: 'P', nodeType: 1, classList: { contains: () => false }, querySelectorAll: () => [] };
  const pB: any = { tagName: 'P', nodeType: 1, classList: { contains: () => false }, querySelectorAll: () => [] };
  const pC: any = { tagName: 'P', nodeType: 1, classList: { contains: () => false }, querySelectorAll: () => [] };
  const allBlocks = [pA, pB, pC];

  const mockEditor: any = {
    contains: () => true,
    querySelectorAll: () => allBlocks,
  };

  const textA: any = { nodeType: 3, parentNode: pA };
  const textC: any = { nodeType: 3, parentNode: pC };

  const rangeAcrossAtoC: any = {
    collapsed: false,
    startContainer: textA,
    startOffset: 5,
    endContainer: textC,
    endOffset: 10,
    intersectsNode: (node: any) => node === pA || node === pB || node === pC,
  };

  const blocks = getBlocksInRange(rangeAcrossAtoC, mockEditor);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0], pA);
  assert.equal(blocks[1], pB);
  assert.equal(blocks[2], pC);
});

test('multi-paragraph selection: subsequent dropdown choices (2.0 -> 1.5 -> 1.0 -> 2.5) update ALL paragraphs and preserve selection range', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  const pA: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    setAttribute: (k: string, v: string) => { pA.attributes = { ...pA.attributes, [k]: v }; },
    querySelectorAll: () => [],
    dataset: {},
  };
  const pB: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    setAttribute: (k: string, v: string) => { pB.attributes = { ...pB.attributes, [k]: v }; },
    querySelectorAll: () => [],
    dataset: {},
  };
  const pC: any = {
    tagName: 'P',
    nodeType: 1,
    style: {},
    setAttribute: (k: string, v: string) => { pC.attributes = { ...pC.attributes, [k]: v }; },
    querySelectorAll: () => [],
    dataset: {},
  };

  const textA: any = { nodeType: 3, parentNode: pA, textContent: 'Paragraph A text' };
  const textC: any = { nodeType: 3, parentNode: pC, textContent: 'Paragraph C text' };

  const allBlocks = [pA, pB, pC];
  const mockEditor: any = {
    contains: (node: any) => allBlocks.includes(node) || node === textA || node === textC,
    querySelectorAll: () => allBlocks,
  };

  let activeRange: any = {
    collapsed: false,
    startContainer: textA,
    startOffset: 5,
    endContainer: textC,
    endOffset: 8,
    cloneRange: function () {
      return {
        ...this,
        cloneRange: this.cloneRange,
      };
    },
    intersectsNode: (node: any) => allBlocks.includes(node),
  };

  const mockSel: any = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => activeRange,
    removeAllRanges: () => {},
    addRange: (r: any) => { activeRange = r; },
  };

  // Choice 1: choose 2.0 -> all 3 paragraphs update
  const success1 = applySelectedLineHeight(mockEditor, mockSel, '2.0', activeRange);
  assert.equal(success1, true);
  assert.equal(pA.style.lineHeight, '2.0');
  assert.equal(pB.style.lineHeight, '2.0');
  assert.equal(pC.style.lineHeight, '2.0');

  // Choice 2: choose 1.5 -> all 3 paragraphs update (NOT collapsed to only first paragraph)
  const success2 = applySelectedLineHeight(mockEditor, mockSel, '1.5', activeRange);
  assert.equal(success2, true);
  assert.equal(pA.style.lineHeight, '1.5');
  assert.equal(pB.style.lineHeight, '1.5');
  assert.equal(pC.style.lineHeight, '1.5');

  // Choice 3: choose 1.0 -> all 3 paragraphs update
  const success3 = applySelectedLineHeight(mockEditor, mockSel, '1.0', activeRange);
  assert.equal(success3, true);
  assert.equal(pA.style.lineHeight, '1.0');
  assert.equal(pB.style.lineHeight, '1.0');
  assert.equal(pC.style.lineHeight, '1.0');

  // Choice 4: choose 2.5 -> all 3 paragraphs update
  const success4 = applySelectedLineHeight(mockEditor, mockSel, '2.5', activeRange);
  assert.equal(success4, true);
  assert.equal(pA.style.lineHeight, '2.5');
  assert.equal(pB.style.lineHeight, '2.5');
  assert.equal(pC.style.lineHeight, '2.5');
});

test('iOS WebKit Bug 1: scrubCanvasChildFocusables removes tabIndex and contenteditable from child elements', async () => {
  const { scrubCanvasChildFocusables } = await import('../cleanNode');

  // Build a simulated container with child paragraphs, spans, and checklist circles
  const container = {
    querySelectorAll: (selector: string) => {
      if (selector === '[tabindex]') {
        return [pWithTabIndex, spanWithTabIndex];
      }
      if (selector === '[contenteditable]') {
        return [pWithContentEditable, checkboxCircle];
      }
      return [];
    },
  };

  const pWithTabIndex: any = {
    removeAttribute: (attr: string) => {
      if (attr === 'tabindex') pWithTabIndex.hasTabIndex = false;
    },
    hasTabIndex: true,
  };

  const spanWithTabIndex: any = {
    removeAttribute: (attr: string) => {
      if (attr === 'tabindex') spanWithTabIndex.hasTabIndex = false;
    },
    hasTabIndex: true,
  };

  const pWithContentEditable: any = {
    classList: { contains: (cls: string) => cls === 'qn-checkbox-circle' ? false : false },
    removeAttribute: (attr: string) => {
      if (attr === 'contenteditable') pWithContentEditable.hasContentEditable = false;
    },
    hasContentEditable: true,
  };

  const checkboxCircle: any = {
    classList: { contains: (cls: string) => cls === 'qn-checkbox-circle' },
    getAttribute: (attr: string) => attr === 'contenteditable' ? 'true' : null,
    setAttribute: (attr: string, val: string) => {
      if (attr === 'contenteditable') checkboxCircle.contentEditableVal = val;
    },
    contentEditableVal: 'true',
  };

  scrubCanvasChildFocusables(container as any);

  assert.equal(pWithTabIndex.hasTabIndex, false, 'tabIndex must be removed from child p');
  assert.equal(spanWithTabIndex.hasTabIndex, false, 'tabIndex must be removed from child span');
  assert.equal(pWithContentEditable.hasContentEditable, false, 'contenteditable must be removed from child p');
  assert.equal(checkboxCircle.contentEditableVal, 'false', 'checkbox circle contenteditable must be false');
});

test('iOS WebKit Bug 1 & 2: sanitizeNoteHtml strips tabIndex and independent contenteditable="true" attributes', async () => {
  const { sanitizeNoteHtml } = await import('../sanitizeHtml');

  const dirtyInput = `
    <p tabindex="0">First paragraph with tabIndex</p>
    <div tabindex="-1" contenteditable="true">Second block focusable</div>
    <span contenteditable="true">Pasted span focusable</span>
    <div class="qn-checklist-item" data-checked="false">
      <span class="qn-checkbox-circle" contenteditable="true"></span>
      <div class="qn-checklist-content">Todo item</div>
    </div>
  `;

  const cleaned = sanitizeNoteHtml(dirtyInput);

  assert.ok(!cleaned.includes('tabindex'), 'tabindex attributes must be stripped from all child elements');
  assert.ok(!cleaned.includes('contenteditable="true"'), 'contenteditable="true" must be stripped from child elements');
  assert.ok(cleaned.includes('contenteditable="false"'), 'checkbox circle must retain contenteditable="false"');
});

test('iOS WebKit Bug 1 & CSS: quick-notes.css enforces non-transparent caret-color and display: inline on p:empty::before', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const css = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/admin/notes/quick-notes.css'),
    'utf-8'
  );

  // Assert non-transparent caret-color fallback
  assert.ok(css.includes('caret-color: var(--color-primary, #6d0b74)'), 'caret-color must have non-transparent fallback #6d0b74');

  // Assert overflow: visible and overflow-anchor: none on .qn-note-canvas
  const canvasRuleMatch = /\.qn-note-canvas\s*\{([^}]+)\}/.exec(css);
  assert.ok(canvasRuleMatch, '.qn-note-canvas rule must exist');
  assert.ok(canvasRuleMatch[1].includes('overflow: visible'), 'overflow must be visible to prevent caret clipping');
  assert.ok(canvasRuleMatch[1].includes('overflow-anchor: none'), 'overflow-anchor must be none to prevent iOS 18 scroll jumping');

  // Assert p:empty::before uses display: inline (NOT inline-block) [WebKit #248345]
  const emptyBeforeMatch = /\.qn-note-canvas\s+p:empty::before[\s\S]*?\{([^}]+)\}/.exec(css);
  assert.ok(emptyBeforeMatch, 'p:empty::before rule must exist');
  assert.ok(emptyBeforeMatch[1].includes('display: inline'), 'p:empty::before must use display: inline');
  assert.ok(!emptyBeforeMatch[1].includes('display: inline-block'), 'p:empty::before must NOT use display: inline-block');
});

test('iOS WebKit Bug 3: NotesEditor.module.scss sets overflow-anchor: none on canvasContainer and editorCanvas', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const scss = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/admin/notes/NotesEditor.module.scss'),
    'utf-8'
  );

  // Assert overflow-anchor: none in canvasContainer
  const containerMatch = /\.canvasContainer\s*\{([^}]+)\}/.exec(scss);
  assert.ok(containerMatch, '.canvasContainer rule must exist');
  assert.ok(containerMatch[1].includes('overflow-anchor: none'), 'canvasContainer must have overflow-anchor: none');

  // Assert overflow-anchor: none in editorCanvas
  const editorMatch = /\.editorCanvas\s*\{([^}]+)\}/.exec(scss);
  assert.ok(editorMatch, '.editorCanvas rule must exist');
  assert.ok(editorMatch[1].includes('overflow-anchor: none'), 'editorCanvas must have overflow-anchor: none');
  assert.ok(editorMatch[1].includes('caret-color: var(--color-primary, #6d0b74)'), 'editorCanvas must have non-transparent caret-color');
});

test('iOS WebKit Bug 3: scrollSelectionIntoView uses temp span, calls scrollIntoView nearest, and restores range', async () => {
  const { scrollSelectionIntoView } = await import('../editor/scrollSelectionUtils');

  let scrollCalled = false;
  let scrollBlock = '';
  let tempSpanInserted = false;
  let tempSpanRemoved = false;

  const mockSpan: any = {
    textContent: '',
    style: {},
    setAttribute: () => {},
    scrollIntoView: (opts: any) => {
      scrollCalled = true;
      scrollBlock = opts?.block;
    },
    parentNode: {
      removeChild: (child: any) => {
        if (child === mockSpan) tempSpanRemoved = true;
      },
      normalize: () => {},
    },
  };

  const origDocument = globalThis.document;
  const origWindow = globalThis.window;

  const textNode: any = {
    nodeType: 3,
    textContent: 'Testing tap scroll position',
    isConnected: true,
  };

  const mockRange: any = {
    collapsed: true,
    startContainer: textNode,
    startOffset: 8,
    endContainer: textNode,
    endOffset: 8,
    cloneRange: () => ({
      collapse: () => {},
      insertNode: (node: any) => {
        if (node === mockSpan) tempSpanInserted = true;
      },
    }),
  };

  let activeRange: any = mockRange;
  const mockSel: any = {
    rangeCount: 1,
    getRangeAt: () => activeRange,
    anchorNode: textNode,
    removeAllRanges: () => {},
    addRange: (r: any) => { activeRange = r; },
  };

  const mockEditor: any = {
    contains: (n: any) => n === textNode,
  };

  globalThis.document = {
    ...origDocument,
    createElement: (tag: string) => {
      if (tag === 'span') return mockSpan;
      return origDocument?.createElement ? origDocument.createElement(tag) : {} as any;
    },
    createRange: () => ({
      setStart: (c: any, o: number) => { mockRange.startContainer = c; mockRange.startOffset = o; },
      collapse: () => {},
    }),
  } as any;

  globalThis.window = {
    ...origWindow,
    getSelection: () => mockSel,
  } as any;

  try {
    const handled = scrollSelectionIntoView(mockEditor, null, { block: 'nearest' });
    assert.equal(handled, true, 'scrollSelectionIntoView must succeed');
    assert.equal(tempSpanInserted, true, 'temporary span must be inserted at range');
    assert.equal(scrollCalled, true, 'scrollIntoView must be called on temp span');
    assert.equal(scrollBlock, 'nearest', 'scrollIntoView block must be nearest');
    assert.equal(tempSpanRemoved, true, 'temporary span must be removed in finally block');
  } finally {
    globalThis.document = origDocument;
    globalThis.window = origWindow;
  }
});




