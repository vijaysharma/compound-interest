import React from 'react';
import { FiCheck, FiCopy, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { Streamline } from './types';
import styles from './StrategyCalculator.module.scss';
interface StreamlineManagerProps {
  streamlines: Streamline[];
  activeId: string;
  onSelectStreamline: (id: string) => void;
  onUpdateName: (name: string) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  isSaved: boolean;
}
export const StreamlineManager: React.FC<StreamlineManagerProps> = ({
  streamlines,
  activeId,
  onSelectStreamline,
  onUpdateName,
  onSave,
  onDuplicate,
  onAdd,
  onDelete,
  isSaved,
}) => {
  const active = streamlines.find((s) => s.id === activeId) || streamlines[0];
  return (
    <div className={styles.streamlineManager}>
      <div className={styles.streamlineTabsHeader}>
        <div className={styles.streamlineTabsList}>
          {streamlines.map((s, idx) => {
            const isActive = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                className={`${styles.streamlineTab} ${isActive ? styles.activeTab : ''}`}
                onClick={() => onSelectStreamline(s.id)}
              >
                <span className={styles.tabDot} data-index={idx % 3} />
                <span className={styles.tabLabel}>{s.name || `Plan ${idx + 1}`}</span>
              </button>
            );
          })}
        </div>
        {streamlines.length < 3 && (
          <button
            type="button"
            className={styles.addStreamlineBtn}
            onClick={onAdd}
            title="Add New Streamline (Max 3)"
          >
            <FiPlus />
            <span>New</span>
          </button>
        )}
      </div>
      <div className={styles.streamlineMetaRow}>
        <input
          type="text"
          className={styles.streamlineNameInput}
          value={active?.name || ''}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder="Streamline Name..."
        />
        <div className={styles.streamlineActionsGroup}>
          <button
            type="button"
            className={`${styles.streamlineActionBtn} ${isSaved ? styles.savedSuccessBtn : ''}`}
            onClick={onSave}
            title="Save Streamline"
          >
            {isSaved ? <FiCheck /> : <FiSave />}
            <span>{isSaved ? 'Saved!' : 'Save'}</span>
          </button>
          <button
            type="button"
            className={styles.streamlineActionBtn}
            onClick={onDuplicate}
            disabled={streamlines.length >= 3}
            title="Duplicate Streamline"
          >
            <FiCopy />
            <span>Duplicate</span>
          </button>
          {streamlines.length > 1 && (
            <button
              type="button"
              className={styles.streamlineDeleteBtn}
              onClick={() => onDelete(activeId)}
              title="Delete Streamline"
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
