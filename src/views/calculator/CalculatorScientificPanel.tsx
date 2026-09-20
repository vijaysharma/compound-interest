import React from 'react';
import styles from '../Calculator.module.scss';
interface CalculatorScientificPanelProps {
  showScientific: boolean;
  isDeg: boolean;
  setIsDeg: (deg: boolean) => void;
  memory: number;
  onMemoryClear: () => void;
  onMemoryRecall: () => void;
  onMemoryAdd: () => void;
  onMemorySubtract: () => void;
  onInsert: (char: string) => void;
  onInsertEE: () => void;
  onInsertYRoot: () => void;
}
export const CalculatorScientificPanel: React.FC<CalculatorScientificPanelProps> = ({
  showScientific,
  isDeg,
  setIsDeg,
  memory,
  onMemoryClear,
  onMemoryRecall,
  onMemoryAdd,
  onMemorySubtract,
  onInsert,
  onInsertEE,
  onInsertYRoot,
}) => {
  if (!showScientific) return null;
  const scientificButtons = [
    { label: 'sin', fn: () => onInsert('sin(') },
    { label: 'cos', fn: () => onInsert('cos(') },
    { label: 'tan', fn: () => onInsert('tan(') },
    { label: 'ln', fn: () => onInsert('ln(') },
    { label: 'log', fn: () => onInsert('log(') },
    { label: 'sinh', fn: () => onInsert('sinh(') },
    { label: 'cosh', fn: () => onInsert('cosh(') },
    { label: 'tanh', fn: () => onInsert('tanh(') },
    { label: 'e', fn: () => onInsert('e') },
    { label: 'EE', fn: onInsertEE },
    { label: 'sin⁻¹', fn: () => onInsert('asin(') },
    { label: 'cos⁻¹', fn: () => onInsert('acos(') },
    { label: 'tan⁻¹', fn: () => onInsert('atan(') },
    { label: '√', fn: () => onInsert('√(') },
    { label: '∛', fn: () => onInsert('∛(') },
    { label: 'ʸ√x', fn: onInsertYRoot },
    { label: 'xʸ', fn: () => onInsert('^') },
    { label: '1/x', fn: () => onInsert('1/(') },
    { label: 'π', fn: () => onInsert('π') },
    { label: 'x!', fn: () => onInsert('!') },
  ];
  return (
    <div className={styles.scientificPanel}>
      <div className={styles.degRadMemoryRow}>
        <div className={styles.degRadGroup}>
          <button
            type="button"
            className={`${styles.degRadBtn} ${isDeg ? styles.active : ''}`}
            onClick={() => setIsDeg(true)}
          >
            DEG
          </button>
          <button
            type="button"
            className={`${styles.degRadBtn} ${!isDeg ? styles.active : ''}`}
            onClick={() => setIsDeg(false)}
          >
            RAD
          </button>
        </div>
        <div className={styles.memoryActions}>
          <button
            type="button"
            onClick={onMemoryClear}
            disabled={memory === 0}
            className={`${styles.memoryActionBtn} ${styles.memoryActionBtnError}`}
            title="Memory Clear (MC)"
          >
            MC
          </button>
          <button
            type="button"
            onClick={onMemoryRecall}
            disabled={memory === 0}
            className={styles.memoryActionBtn}
            title="Memory Recall (MR)"
          >
            MR
          </button>
          <button
            type="button"
            onClick={onMemoryAdd}
            className={styles.memoryActionBtn}
            title="Memory Add (M+)"
          >
            M+
          </button>
          <button
            type="button"
            onClick={onMemorySubtract}
            className={styles.memoryActionBtn}
            title="Memory Subtract (M-)"
          >
            M-
          </button>
        </div>
      </div>
      <div className={styles.scientificGrid}>
        {scientificButtons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={btn.fn}
            className={styles.scientificKey}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};
