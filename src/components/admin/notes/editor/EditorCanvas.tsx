import React, { RefObject, ChangeEvent, FormEvent } from 'react';
import { Note } from '../NotesTypes';
import { EditorCanvasMeta } from './EditorCanvasMeta';
import styles from '../NotesEditor.module.scss';
interface EditorCanvasProps {
  note: Note;
  isTrash: boolean;
  isSaving: boolean;
  isPendingSave?: boolean;
  autoSaveEnabled?: boolean;
  wordCount: number;
  charCount: number;
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  editorRef: RefObject<HTMLDivElement | null>;
  titleInputRef: RefObject<HTMLInputElement | null>;
  titleValue?: string;
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  isAddingTag: boolean;
  setIsAddingTag: (val: boolean) => void;
  onCloseMenus: () => void;
  onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTitleBlur?: () => void;
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
  note, isTrash, isSaving, isPendingSave, autoSaveEnabled, wordCount, charCount, canvasContainerRef, editorRef,
  titleInputRef, titleValue, newTagInput, setNewTagInput, isAddingTag, setIsAddingTag,
  onCloseMenus, onTitleChange, onTitleBlur, onAddTag, onRemoveTag, onOpenSecurityModal,
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
          isPendingSave={isPendingSave}
          autoSaveEnabled={autoSaveEnabled}
          wordCount={wordCount}
          charCount={charCount}
          titleInputRef={titleInputRef}
          titleValue={titleValue}
          onTitleChange={onTitleChange}
          onTitleBlur={onTitleBlur}
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
          onPaste={(e) => {
            if (isTrash) {
              e.preventDefault();
              return;
            }
            onPaste(e);
          }}
          onInput={() => {
            if (isTrash) return;
            onInput();
          }}
          onClick={onClick}
          onKeyDown={(e) => {
            if (isTrash) {
              e.preventDefault();
              return;
            }
            onKeyDown(e);
          }}
          onKeyUp={onSaveSelection}
          onMouseUp={onSaveSelection}
          className={`${styles.editorCanvas} qn-note-canvas`}
          data-placeholder="Start typing or tap the checklist button below..."
        />
      </div>
    </div>
  );
};
