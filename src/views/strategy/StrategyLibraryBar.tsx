'use client';
import React, { useState } from 'react';
import { FiCheck, FiCopy, FiEdit2, FiPlus, FiRotateCcw, FiTrash2, FiX } from 'react-icons/fi';
import type { StrategyLibraryApi } from './useStrategyLibrary';
import styles from './StrategyCalculator.module.scss';
interface StrategyLibraryBarProps {
  library: StrategyLibraryApi;
  onReset: () => void;
}
interface PendingAction {
  mode: 'rename' | 'delete';
  id: string;
  draft: string;
}
export const StrategyLibraryBar = ({ library, onReset }: StrategyLibraryBarProps) => {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const open = pending && pending.id === library.activeId ? pending : null;
  const commitRename = () => {
    if (open?.mode === 'rename') library.renameStrategy(open.draft);
    setPending(null);
  };
  if (!library.isReady) return null;
  if (open?.mode === 'rename') {
    return (
      <div className={styles.libraryBar}>
        <label className={styles.srOnly} htmlFor="strategy-rename">
          Strategy name
        </label>
        <input
          id="strategy-rename"
          className={styles.libraryInput}
          value={open.draft}
          autoFocus
          maxLength={60}
          onChange={(event) => setPending({ ...open, draft: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitRename();
            if (event.key === 'Escape') setPending(null);
          }}
        />
        <button type="button" className={styles.libraryButton} onClick={commitRename}>
          <FiCheck aria-hidden="true" /> Save
        </button>
        <button
          type="button"
          className={styles.libraryButton}
          onClick={() => setPending(null)}
          aria-label="Cancel renaming"
        >
          <FiX aria-hidden="true" />
        </button>
      </div>
    );
  }
  const roomHint = library.canAdd ? undefined : 'Delete a strategy to make room for another';
  return (
    <div className={styles.libraryBar}>
      <label className={styles.srOnly} htmlFor="strategy-picker">
        Saved strategy
      </label>
      <select
        id="strategy-picker"
        className={styles.librarySelect}
        value={library.activeId}
        onChange={(event) => library.selectStrategy(event.target.value)}
      >
        {library.strategies.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.libraryButton}
        onClick={library.addStrategy}
        disabled={!library.canAdd}
        title={roomHint}
      >
        <FiPlus aria-hidden="true" /> New
      </button>
      <button
        type="button"
        className={styles.libraryButton}
        onClick={library.duplicateStrategy}
        disabled={!library.canAdd}
        title={roomHint}
      >
        <FiCopy aria-hidden="true" /> Duplicate
      </button>
      <button
        type="button"
        className={styles.libraryButton}
        onClick={() =>
          setPending({ mode: 'rename', id: library.activeId, draft: library.activeName })
        }
      >
        <FiEdit2 aria-hidden="true" /> Rename
      </button>
      {open?.mode === 'delete' ? (
        <>
          <button
            type="button"
            className={`${styles.libraryButton} ${styles.libraryDanger}`}
            onClick={() => {
              library.deleteStrategy(library.activeId);
              setPending(null);
            }}
          >
            <FiTrash2 aria-hidden="true" /> Delete “{library.activeName}”?
          </button>
          <button
            type="button"
            className={styles.libraryButton}
            onClick={() => setPending(null)}
            aria-label="Keep this strategy"
          >
            <FiX aria-hidden="true" />
          </button>
        </>
      ) : (
        <button
          type="button"
          className={styles.libraryButton}
          onClick={() => setPending({ mode: 'delete', id: library.activeId, draft: '' })}
          disabled={!library.canDelete}
          title={library.canDelete ? undefined : 'The last strategy cannot be deleted'}
        >
          <FiTrash2 aria-hidden="true" /> Delete
        </button>
      )}
      <button type="button" className={styles.libraryButton} onClick={onReset}>
        <FiRotateCcw aria-hidden="true" /> Reset
      </button>
    </div>
  );
};
