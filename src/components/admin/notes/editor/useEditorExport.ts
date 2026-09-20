import { RefObject, useState, useCallback } from 'react';
import { Note, htmlToMarkdown, htmlToPlainText } from '../NotesTypes';
interface UseEditorExportParams {
  note: Note | null;
  editorRef: RefObject<HTMLDivElement | null>;
}
export function useEditorExport({ note, editorRef }: UseEditorExportParams) {
  const [copySuccess, setCopySuccess] = useState(false);
  const triggerCopyFeedback = useCallback(() => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, []);
  const handleExportMarkdown = useCallback(() => {
    if (!note) return;
    const md = htmlToMarkdown(note.title, note.content);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [note]);
  const handleExportText = useCallback(() => {
    if (!note) return;
    const txt = htmlToPlainText(note.title, note.content);
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [note]);
  const handlePrint = useCallback(() => {
    window.print();
  }, []);
  const handleCopy = useCallback(async () => {
    if (!note) return;
    const text = htmlToPlainText(note.title, note.content);
    try {
      await navigator.clipboard.writeText(text);
      triggerCopyFeedback();
    } catch (err) {
      console.error(err);
    }
  }, [note, triggerCopyFeedback]);
  const handleCopySelection = useCallback(async () => {
    const sel = window.getSelection();
    let textToCopy = '';
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      textToCopy = sel.toString();
    } else if (editorRef.current) {
      textToCopy = editorRef.current.innerText || '';
    }
    if (!textToCopy && note) {
      textToCopy = htmlToPlainText(note.title, note.content);
    }
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        triggerCopyFeedback();
      } catch (err) {
        console.error(err);
      }
    }
  }, [editorRef, note, triggerCopyFeedback]);
  const handleDumpToGoogleDrive = useCallback(async () => {
    if (!note) return;
    const md = htmlToMarkdown(note.title, note.content);
    const blob = new Blob([md], { type: 'text/markdown' });
    const fileName = `${note.title || 'Note'}.md`;
    const file = new File([blob], fileName, { type: 'text/markdown' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: note.title || 'Note', text: 'Save note to Google Drive', files: [file] });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    handleExportMarkdown();
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
  }, [note, handleExportMarkdown]);
  const handleDumpToOneDrive = useCallback(async () => {
    if (!note) return;
    const md = htmlToMarkdown(note.title, note.content);
    const blob = new Blob([md], { type: 'text/markdown' });
    const fileName = `${note.title || 'Note'}.md`;
    const file = new File([blob], fileName, { type: 'text/markdown' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: note.title || 'Note', text: 'Save note to OneDrive', files: [file] });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    handleExportMarkdown();
    window.open('https://onedrive.live.com', '_blank', 'noopener,noreferrer');
  }, [note, handleExportMarkdown]);
  return {
    copySuccess,
    handleExportMarkdown,
    handleExportText,
    handlePrint,
    handleCopy,
    handleCopySelection,
    handleDumpToGoogleDrive,
    handleDumpToOneDrive,
  };
}
