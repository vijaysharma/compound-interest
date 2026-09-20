import React from 'react';
import { FiClock, FiRotateCcw, FiX } from 'react-icons/fi';
import { HistoryItem } from './types';
import styles from '../Calculator.module.scss';
interface CalculatorHistoryDrawerProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
}
export const CalculatorHistoryDrawer: React.FC<CalculatorHistoryDrawerProps> = ({
  showHistory,
  setShowHistory,
  history,
  onClearHistory,
  onSelectHistoryItem,
}) => {
  if (!showHistory) return null;
  return (
    <div className={styles.historyDrawer}>
      <div className={styles.historyHeader}>
        <span className={styles.historyTitle}>
          <FiClock size={14} /> History
        </span>
        <div className={styles.historyControls}>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className={styles.clearHistoryBtn}
              title="Clear history"
            >
              <FiRotateCcw size={12} /> Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className={styles.closeHistoryBtn}
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      {history.length === 0 ? (
        <p className={styles.emptyHistory}>No recent calculations</p>
      ) : (
        <div className={styles.historyList}>
          {history.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectHistoryItem(item)}
              className={styles.historyItem}
            >
              <p className={styles.historyExpr}>{item.expression}</p>
              <p className={styles.historyResult}>{item.result}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
