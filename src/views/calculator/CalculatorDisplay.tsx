import React, { useRef } from 'react';
import styles from '../Calculator.module.scss';
interface CalculatorDisplayProps {
  expression: string;
  cursorPosition: number;
  setCursorPosition: (pos: number) => void;
  isEvaluated: boolean;
  setIsEvaluated: (evaluated: boolean) => void;
  memory: number;
  onMemoryRecall: () => void;
  liveResult: string | null;
  onCopy: () => void;
}
export const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({
  expression,
  cursorPosition,
  setCursorPosition,
  isEvaluated,
  setIsEvaluated,
  memory,
  onMemoryRecall,
  liveResult,
  onCopy,
}) => {
  const displayContainerRef = useRef<HTMLDivElement>(null);
  const safeCursor = Math.min(Math.max(0, cursorPosition), expression.length);
  const textBeforeCursor = expression.slice(0, safeCursor);
  const textAfterCursor = expression.slice(safeCursor);
  const renderChar = (ch: string, key: string, onClick: (e: React.MouseEvent) => void) => {
    const isSup = /[⁰¹²³⁴⁵⁶⁷⁸⁹ʸˣ]/.test(ch);
    return (
      <span
        key={key}
        onClick={onClick}
        className={`${styles.charSpan} ${isSup ? styles.charSup : ''}`}
      >
        {ch}
      </span>
    );
  };
  return (
    <>
      {memory !== 0 && (
        <div className={styles.memoryRow}>
          <span
            onClick={onMemoryRecall}
            className={styles.memoryBadge}
            title="Click to recall memory (MR)"
          >
            M = {memory}
          </span>
        </div>
      )}
      <div
        ref={displayContainerRef}
        className={styles.displayInput}
        onClick={(e) => {
          if (e.target === e.currentTarget && expression.length > 0) {
            setCursorPosition(expression.length);
          }
        }}
      >
        <div className={styles.displayLine}>
          {expression.length === 0 ? (
            <span className={styles.displayPlaceholder}>0</span>
          ) : (
            <>
              {textBeforeCursor.split('').map((ch, idx) =>
                renderChar(ch, `before-${idx}`, (e) => {
                  e.stopPropagation();
                  setCursorPosition(idx);
                  setIsEvaluated(false);
                })
              )}
              <span className={styles.cursorCaret} />
              {textAfterCursor.split('').map((ch, idx) =>
                renderChar(ch, `after-${idx}`, (e) => {
                  e.stopPropagation();
                  setCursorPosition(textBeforeCursor.length + idx + 1);
                  setIsEvaluated(false);
                })
              )}
            </>
          )}
        </div>
      </div>
      <div
        onClick={onCopy}
        className={styles.livePreviewRow}
        title="Click to copy result"
      >
        {liveResult !== null && !isEvaluated ? (
          <span className={styles.livePreviewText}>{liveResult}</span>
        ) : (
          <span className={styles.hiddenPlaceholder}>0</span>
        )}
      </div>
    </>
  );
};
