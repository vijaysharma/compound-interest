import React from 'react';
import {
  FiClock,
  FiDelete,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiClipboard,
} from 'react-icons/fi';
import { TbMathFunction } from 'react-icons/tb';
import styles from '../Calculator.module.scss';
interface CalculatorToolbarProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showScientific: boolean;
  setShowScientific: (show: boolean) => void;
  onCopy: () => void;
  onPaste: () => void;
  canCopy: boolean;
  onMoveCursor: (dir: 'left' | 'right') => void;
  cursorPosition: number;
  expressionLength: number;
  onBackspace: () => void;
}
export const CalculatorToolbar: React.FC<CalculatorToolbarProps> = ({
  showHistory,
  setShowHistory,
  showScientific,
  setShowScientific,
  onCopy,
  onPaste,
  canCopy,
  onMoveCursor,
  cursorPosition,
  expressionLength,
  onBackspace,
}) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className={`${styles.circleBtn} ${showHistory ? styles.active : ''}`}
          title="Calculation History"
        >
          <FiClock size={16} />
        </button>
        <button
          type="button"
          onClick={() => setShowScientific(!showScientific)}
          className={`${styles.scientificToggleBtn} ${showScientific ? styles.active : ''}`}
          title="Toggle Scientific Keypad (Trig, Hyperbolic, Roots, Exponents)"
        >
          <TbMathFunction size={16} />
          <span>Scientific</span>
        </button>
        <button
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          className={styles.circleBtn}
          title="Copy expression or result (Ctrl+C / ⌘C)"
        >
          <FiCopy size={16} />
        </button>
        <button
          type="button"
          onClick={onPaste}
          className={styles.circleBtn}
          title="Paste expression (Ctrl+V / ⌘V)"
        >
          <FiClipboard size={16} />
        </button>
      </div>
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          onClick={() => onMoveCursor('left')}
          className={styles.circleBtn}
          title="Move cursor left"
          disabled={cursorPosition === 0}
        >
          <FiChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMoveCursor('right')}
          className={styles.circleBtn}
          title="Move cursor right"
          disabled={cursorPosition >= expressionLength}
        >
          <FiChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className={`${styles.circleBtn} ${styles.toolBtnPrimary}`}
          title="Backspace"
        >
          <FiDelete size={20} />
        </button>
      </div>
    </div>
  );
};
