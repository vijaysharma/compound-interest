import { useRef, useState, useEffect } from 'react';
import { NotesEditorProps } from './types';
import { useEditorPropagation } from './useEditorPropagation';
import { useEditorHistory } from './useEditorHistory';
import { useEditorContent } from './useEditorContent';
import { useEditorSelection } from './useEditorSelection';
import { useEditorFormatting } from './useEditorFormatting';
import { useEditorListAndTable } from './useEditorListAndTable';
import { useEditorChecklist } from './useEditorChecklist';
import { useEditorKeyboard } from './useEditorKeyboard';
import { useEditorTags } from './useEditorTags';
import { useEditorExport } from './useEditorExport';
import { useEditorViewport } from './useEditorViewport';
export function useNotesEditorState(props: NotesEditorProps) {
  const { note, onUpdateNote } = props;
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const saveSelectionRef = useRef<() => void>(() => {});
  const handleContentChangeRef = useRef<(force?: boolean) => void>(() => {});
  const propagation = useEditorPropagation({ noteId: note?.id, onUpdateNote });
  const history = useEditorHistory({
    editorRef,
    saveSelection: () => saveSelectionRef.current(),
    handleContentChange: (f) => handleContentChangeRef.current(f),
  });
  const content = useEditorContent({
    note,
    editorRef,
    historyStackRef: history.historyStackRef,
    historyIndexRef: history.historyIndexRef,
    isUndoRedoRef: history.isUndoRedoRef,
    lastSnapshotTimeRef: history.lastSnapshotTimeRef,
    pushSnapshot: history.pushSnapshot,
    schedulePropagation: propagation.schedulePropagation,
  });
  const selection = useEditorSelection({
    editorRef,
    setCurrentFontSize: content.setCurrentFontSize,
  });
  useEffect(() => {
    saveSelectionRef.current = selection.saveSelection;
    handleContentChangeRef.current = content.handleContentChange;
  });
  const formatting = useEditorFormatting({
    editorRef,
    noteId: note?.id,
    currentFontSize: content.currentFontSize,
    setCurrentFontSize: content.setCurrentFontSize,
    saveSelection: selection.saveSelection,
    restoreSelection: selection.restoreSelection,
    handleContentChange: content.handleContentChange,
  });
  const listAndTable = useEditorListAndTable({
    editorRef,
    execCmd: formatting.execCmd,
    handleContentChange: content.handleContentChange,
  });
  const viewport = useEditorViewport({ editorRef, canvasContainerRef });
  const checklist = useEditorChecklist({
    editorRef,
    activeMobileMenu: viewport.activeMobileMenu,
    setActiveMobileMenu: viewport.setActiveMobileMenu,
    setActiveTable: listAndTable.setActiveTable,
    handleContentChange: content.handleContentChange,
  });
  const keyboard = useEditorKeyboard({
    handleUndo: history.handleUndo,
    handleRedo: history.handleRedo,
    execCmd: formatting.execCmd,
    insertChecklistItem: checklist.insertChecklistItem,
    handleIndent: formatting.handleIndent,
    handleOutdent: formatting.handleOutdent,
    handleContentChange: content.handleContentChange,
  });
  const tags = useEditorTags({
    note,
    hasManualTitleRef: content.hasManualTitleRef,
    onUpdateNote,
    calculateStats: content.calculateStats,
  });
  const exportOps = useEditorExport({ note, editorRef });
  return {
    editorRef,
    titleInputRef,
    canvasContainerRef,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showMoveModal,
    setShowMoveModal,
    propagation,
    history,
    content,
    selection,
    formatting,
    listAndTable,
    viewport,
    checklist,
    keyboard,
    tags,
    exportOps,
  };
}
