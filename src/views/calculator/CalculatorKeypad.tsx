import React from 'react';
import styles from '../Calculator.module.scss';
interface CalculatorKeypadProps {
  expression: string;
  onClear: () => void;
  onSmartParentheses: () => void;
  onInsert: (char: string) => void;
  onToggleSign: () => void;
  onCalculate: () => void;
}
export const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({
  expression,
  onClear,
  onSmartParentheses,
  onInsert,
  onToggleSign,
  onCalculate,
}) => {
  return (
    <div className={styles.keypadGrid}>
      {/* Row 1: C, ( ), %, ÷ */}
      <button
        type="button"
        onClick={onClear}
        className={`${styles.keypadBtn} ${styles.keypadBtnClear}`}
      >
        {expression ? 'C' : 'AC'}
      </button>
      <button
        type="button"
        onClick={onSmartParentheses}
        className={`${styles.keypadBtn} ${styles.keypadBtnFunction}`}
      >
        ( )
      </button>
      <button
        type="button"
        onClick={() => onInsert('%')}
        className={`${styles.keypadBtn} ${styles.keypadBtnFunction}`}
      >
        %
      </button>
      <button
        type="button"
        onClick={() => onInsert('÷')}
        className={`${styles.keypadBtn} ${styles.keypadBtnOperator}`}
      >
        ÷
      </button>
      {/* Row 2: 7, 8, 9, × */}
      {['7', '8', '9'].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onInsert(num)}
          className={`${styles.keypadBtn} ${styles.keypadBtnNumber}`}
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onInsert('×')}
        className={`${styles.keypadBtn} ${styles.keypadBtnOperator}`}
      >
        ×
      </button>
      {/* Row 3: 4, 5, 6, − */}
      {['4', '5', '6'].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onInsert(num)}
          className={`${styles.keypadBtn} ${styles.keypadBtnNumber}`}
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onInsert('−')}
        className={`${styles.keypadBtn} ${styles.keypadBtnOperator}`}
      >
        −
      </button>
      {/* Row 4: 1, 2, 3, + */}
      {['1', '2', '3'].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onInsert(num)}
          className={`${styles.keypadBtn} ${styles.keypadBtnNumber}`}
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onInsert('+')}
        className={`${styles.keypadBtn} ${styles.keypadBtnOperator}`}
      >
        +
      </button>
      {/* Row 5: +/-, 0, ., = */}
      <button
        type="button"
        onClick={onToggleSign}
        className={`${styles.keypadBtn} ${styles.keypadBtnNumber}`}
      >
        +/−
      </button>
      <button
        type="button"
        onClick={() => onInsert('0')}
        className={`${styles.keypadBtn} ${styles.keypadBtnNumber}`}
      >
        0
      </button>
      <button
        type="button"
        onClick={() => onInsert('.')}
        className={`${styles.keypadBtn} ${styles.keypadBtnNumber} ${styles.fontBold}`}
      >
        .
      </button>
      <button
        type="button"
        onClick={onCalculate}
        className={`${styles.keypadBtn} ${styles.keypadBtnEquals}`}
      >
        =
      </button>
    </div>
  );
};
