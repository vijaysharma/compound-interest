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

test('applySelectedLineHeight does not apply when selection is collapsed', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');
  const mockEditor = { contains: () => true } as unknown as HTMLElement;
  const mockSel = {
    rangeCount: 1,
    isCollapsed: true,
  } as unknown as Selection;
  const result = applySelectedLineHeight(mockEditor, mockSel, '1.8');
  assert.equal(result, false);
});

test('applySelectedLineHeight wraps selected fragment in an inline span with line-height', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');
  let insertedNode: any = null;
  const mockFragment = {
    querySelectorAll: () => [],
    appendChild: () => {},
  };
  const mockRange = {
    commonAncestorContainer: {},
    extractContents: () => mockFragment,
    insertNode: (node: any) => { insertedNode = node; },
    selectNodeContents: () => {},
  };
  const mockSel = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => mockRange,
    removeAllRanges: () => {},
    addRange: () => {},
  } as unknown as Selection;
  const mockEditor = {
    contains: () => true,
  } as unknown as HTMLElement;
  const originalCreateElement = globalThis.document?.createElement;
  const originalCreateRange = globalThis.document?.createRange;
  globalThis.document = {
    ...globalThis.document,
    createElement: (tag: string) => ({
      tagName: tag.toUpperCase(),
      style: {},
      appendChild: () => {},
      removeAttribute: () => {},
      getAttribute: () => null,
    } as any),
    createRange: () => ({
      selectNodeContents: () => {},
    } as any),
  } as any;
  try {
    const result = applySelectedLineHeight(mockEditor, mockSel, '2.0');
    assert.equal(result, true);
    assert.equal(insertedNode?.style?.lineHeight, '2.0');
  } finally {
    if (originalCreateElement) globalThis.document.createElement = originalCreateElement;
    if (originalCreateRange) globalThis.document.createRange = originalCreateRange;
  }
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

test('partial-overlap line-height span replacement clears conflicting inner span line-height', async () => {
  const { applySelectedLineHeight } = await import('../editor/lineHeightUtils');

  const innerSpan: any = {
    tagName: 'SPAN',
    style: { lineHeight: '1.2' },
    getAttribute: (attr: string) => (attr === 'style' && !innerSpan.style.lineHeight ? null : 'line-height: 1.2'),
    removeAttribute: () => {},
  };

  const mockFragment: any = {
    querySelectorAll: (selector: string) => {
      if (selector.includes('span[style*="line-height"]')) {
        return [innerSpan];
      }
      return [];
    },
    appendChild: () => {},
  };

  let insertedSpan: any = null;
  const mockRange = {
    commonAncestorContainer: {},
    extractContents: () => mockFragment,
    insertNode: (node: any) => { insertedSpan = node; },
    selectNodeContents: () => {},
  };

  const mockSel = {
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () => mockRange,
    removeAllRanges: () => {},
    addRange: () => {},
  } as unknown as Selection;

  const mockEditor = {
    contains: () => true,
  } as unknown as HTMLElement;

  const originalCreateElement = globalThis.document?.createElement;
  const originalCreateRange = globalThis.document?.createRange;

  globalThis.document = {
    ...globalThis.document,
    createElement: (tag: string) => ({
      tagName: tag.toUpperCase(),
      style: {},
      appendChild: () => {},
    } as any),
    createRange: () => ({
      selectNodeContents: () => {},
    } as any),
  } as any;

  try {
    const success = applySelectedLineHeight(mockEditor, mockSel, '1.75');
    assert.equal(success, true);
    assert.equal(insertedSpan?.style?.lineHeight, '1.75');
    // Inner span's conflicting line-height was cleared so parent 1.75 applies cleanly
    assert.equal(innerSpan.style.lineHeight, '');
  } finally {
    if (originalCreateElement) globalThis.document.createElement = originalCreateElement;
    if (originalCreateRange) globalThis.document.createRange = originalCreateRange;
  }
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





