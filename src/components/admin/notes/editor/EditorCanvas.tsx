import React, { RefObject, ChangeEvent, FormEvent } from 'react';
import { Note } from '../NotesTypes';
import { EditorCanvasMeta } from './EditorCanvasMeta';
import styles from '../NotesEditor.module.scss';
interface EditorCanvasProps {
  note: Note;
  isTrash: boolean;
  isSaving: boolean;
  wordCount: number;
  charCount: number;
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  editorRef: RefObject<HTMLDivElement | null>;
  titleInputRef: RefObject<HTMLInputElement | null>;
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  isAddingTag: boolean;
  setIsAddingTag: (val: boolean) => void;
  onCloseMenus: () => void;
  onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddTag: (e: FormEvent) => void;
  onRemoveTag: (tag: string) => void;
  onOpenSecurityModal?: () => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onInput: () => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onSaveSelection: () => void;
}
export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  note, isTrash, isSaving, wordCount, charCount, canvasContainerRef, editorRef,
  titleInputRef, newTagInput, setNewTagInput, isAddingTag, setIsAddingTag,
  onCloseMenus, onTitleChange, onAddTag, onRemoveTag, onOpenSecurityModal,
  onPaste, onInput, onClick, onKeyDown, onSaveSelection,
}) => {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onCloseMenus();
    const target = e.target as HTMLElement;
    if (target === canvasContainerRef.current || target.classList.contains('qn-canvas-inner')) {
      if (editorRef.current && !isTrash) {
        editorRef.current.focus();
        const sel = window.getSelection();
        if (sel && (sel.rangeCount === 0 || !editorRef.current.contains(sel.anchorNode))) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  };
  return (
    <div ref={canvasContainerRef} onClick={handleCanvasClick} className={`${styles.canvasContainer} qn-scrollbar`}>
      <div className={`${styles.canvasInner} qn-canvas-inner`}>
        <EditorCanvasMeta
          note={note}
          isTrash={isTrash}
          isSaving={isSaving}
          wordCount={wordCount}
          charCount={charCount}
          titleInputRef={titleInputRef}
          onTitleChange={onTitleChange}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          isAddingTag={isAddingTag}
          setIsAddingTag={setIsAddingTag}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onOpenSecurityModal={onOpenSecurityModal}
        />
        <div
          ref={editorRef}
          contentEditable={!isTrash}
          suppressContentEditableWarning
          onPaste={onPaste}
          onInput={onInput}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onKeyUp={onSaveSelection}
          onMouseUp={onSaveSelection}
          className={`${styles.editorCanvas} qn-note-canvas`}
          data-placeholder="Start typing or tap the checklist button below..."
        />
      </div>
    </div>
  );
};
