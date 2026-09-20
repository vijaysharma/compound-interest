import React from 'react';
import { FiX } from 'react-icons/fi';
import styles from '../NotesEditor.module.scss';
interface EditorTableToolsProps {
  activeTable: HTMLTableElement | null;
  isTrash: boolean;
  onAddRow: () => void;
  onAddColumn: () => void;
  onDeleteTable: () => void;
  onClose: () => void;
}
export const EditorTableTools: React.FC<EditorTableToolsProps> = ({
  activeTable,
  isTrash,
  onAddRow,
  onAddColumn,
  onDeleteTable,
  onClose,
}) => {
  if (!activeTable || isTrash) return null;
  return (
    <div className={styles.tableToolsBar}>
      <span className={styles.tableToolsTitle}>Table Tools:</span>
      <button onClick={onAddRow} className={styles.tableToolBtn}>
        + Add Row
      </button>
      <button onClick={onAddColumn} className={styles.tableToolBtn}>
        + Add Column
      </button>
      <button onClick={onDeleteTable} className={`${styles.tableToolBtn} ${styles.danger}`}>
        Delete Table
      </button>
      <button onClick={onClose} className={`${styles.toolbarBtn} ${styles.mlAuto}`}>
        <FiX size={14} />
      </button>
    </div>
  );
};
