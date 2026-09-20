import { useRef, useEffect, useCallback } from 'react';
import { Note } from '../NotesTypes';
import { CONTENT_PROPAGATE_MS } from './constants';
interface UseEditorPropagationParams {
  noteId?: string;
  onUpdateNote: (updated: Partial<Note>) => void;
}
export function useEditorPropagation({
  noteId,
  onUpdateNote,
}: UseEditorPropagationParams) {
  const pendingPropagationRef = useRef<Partial<Note> | null>(null);
  const propagateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateNoteRef = useRef(onUpdateNote);
  useEffect(() => {
    onUpdateNoteRef.current = onUpdateNote;
  }, [onUpdateNote]);
  const flushPropagation = useCallback(() => {
    if (propagateTimerRef.current) {
      clearTimeout(propagateTimerRef.current);
      propagateTimerRef.current = null;
    }
    const pending = pendingPropagationRef.current;
    if (!pending) return;
    pendingPropagationRef.current = null;
    onUpdateNoteRef.current(pending);
  }, []);
  const schedulePropagation = useCallback(
    (updates: Partial<Note>) => {
      pendingPropagationRef.current = { ...(pendingPropagationRef.current || {}), ...updates };
      if (propagateTimerRef.current) clearTimeout(propagateTimerRef.current);
      propagateTimerRef.current = setTimeout(flushPropagation, CONTENT_PROPAGATE_MS);
    },
    [flushPropagation]
  );
  useEffect(() => flushPropagation, [noteId, flushPropagation]);
  useEffect(() => {
    const onHide = () => flushPropagation();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushPropagation();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flushPropagation]);
  return { flushPropagation, schedulePropagation };
}
