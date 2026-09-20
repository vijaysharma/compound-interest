import React, { RefObject, ChangeEvent, FormEvent } from 'react';
import { FiShield, FiTag, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import { Note, formatNoteHeaderDate } from '../NotesTypes';
import styles from '../NotesEditor.module.scss';
interface EditorCanvasMetaProps {
  note: Note;
  isTrash: boolean;
  isSaving: boolean;
  wordCount: number;
  charCount: number;
  titleInputRef: RefObject<HTMLInputElement | null>;
  onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  isAddingTag: boolean;
  setIsAddingTag: (val: boolean) => void;
  onAddTag: (e: FormEvent) => void;
  onRemoveTag: (tag: string) => void;
  onOpenSecurityModal?: () => void;
}
export const EditorCanvasMeta: React.FC<EditorCanvasMetaProps> = ({
  note,
  isTrash,
  isSaving,
  wordCount,
  charCount,
  titleInputRef,
  onTitleChange,
  newTagInput,
  setNewTagInput,
  isAddingTag,
  setIsAddingTag,
  onAddTag,
  onRemoveTag,
  onOpenSecurityModal,
}) => {
  return (
    <>
      <div className={styles.metaRow}>
        <span className={styles.metaDate}>
          {formatNoteHeaderDate(note.updated_at || note.created_at)}
        </span>
        <div className={styles.metaRight}>
          {onOpenSecurityModal && (
            <button
              type="button"
              onClick={onOpenSecurityModal}
              className={styles.encryptedBadge}
              title="Zero-Knowledge AES-256-GCM End-to-End Encrypted: Click for details"
            >
              <FiShield size={12} className={styles.flexShrink0} />
              <span>E2E Encrypted</span>
            </button>
          )}
          <span>
            {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} characters
          </span>
          <span className={`${styles.saveStatus} ${isSaving ? styles.saving : ''}`}>
            {isSaving ? 'Saving...' : 'Saved'}
          </span>
        </div>
      </div>
      <input
        ref={titleInputRef}
        type="text"
        disabled={isTrash}
        placeholder="Title"
        maxLength={250}
        value={note.title || ''}
        onChange={onTitleChange}
        className={styles.titleInput}
      />
      <div className={styles.tagsRow}>
        <FiTag size={14} className={styles.tagRowIcon} />
        {(note.tags || []).map((tag) => (
          <span key={tag} className={styles.tagChip}>
            #{tag}
            {!isTrash && (
              <button
                onClick={() => onRemoveTag(tag)}
                className={styles.tagRemoveBtn}
                title="Remove tag"
              >
                <FiX size={10} />
              </button>
            )}
          </span>
        ))}
        {!isTrash && (
          <>
            {isAddingTag ? (
              <form onSubmit={onAddTag} className={styles.tagAddForm}>
                <input
                  type="text"
                  autoFocus
                  placeholder="tag name"
                  maxLength={30}
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className={styles.tagInput}
                  onKeyDown={(e) => e.key === 'Escape' && setIsAddingTag(false)}
                />
                <button type="submit" className={`${styles.tagRemoveBtn} ${styles.tagSubmitBtn}`}>
                  <FiCheck size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className={`${styles.tagRemoveBtn} ${styles.tagCancelBtn}`}
                >
                  <FiX size={12} />
                </button>
              </form>
            ) : (
              <button onClick={() => setIsAddingTag(true)} className={styles.tagAddBtn}>
                <FiPlus size={10} />
                Add Tag
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
};
