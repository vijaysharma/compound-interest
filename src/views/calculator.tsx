'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import { useCalculatorState } from './calculator/useCalculatorState';
import { CalculatorToast } from './calculator/CalculatorToast';
import { CalculatorHistoryDrawer } from './calculator/CalculatorHistoryDrawer';
import { CalculatorDisplay } from './calculator/CalculatorDisplay';
import { CalculatorToolbar } from './calculator/CalculatorToolbar';
import { CalculatorScientificPanel } from './calculator/CalculatorScientificPanel';
import { CalculatorKeypad } from './calculator/CalculatorKeypad';
import styles from './Calculator.module.scss';
const Calculator: React.FC = () => {
  const {
    expression,
    setExpression,
    cursorPosition,
    setCursorPosition,
    isEvaluated,
    setIsEvaluated,
    insertAtCursor,
    insertYRoot,
    handleSmartParentheses,
    handleBackspace,
    insertEE,
    handleClear,
    moveCursor,
    handleToggleSign,
    memory,
    handleMemoryAdd,
    handleMemorySubtract,
    handleMemoryRecall,
    handleMemoryClear,
    showHistory,
    setShowHistory,
    history,
    clearHistory,
    showScientific,
    setShowScientific,
    isDeg,
    setIsDeg,
    toastMessage,
    liveResult,
    handleCopy,
    handlePaste,
    handleCalculate,
  } = useCalculatorState();
  return (
    <main className={styles.calculatorMain}>
      <SEOHead
        title="Online Calculator — Free Scientific & Basic Calculator India 2026"
        description="Fast, institutional-grade online calculator with editable cursor display, implicit multiplication, copy/paste support, memory operations (M+, M-, MC, MR), percentages, y-th root of x (³√(27)), and trigonometry."
        keywords="online calculator, scientific calculator, basic calculator, percentage calculator, cube root calculator, math calculator, memory operations calculator, fast calculator"
        canonicalPath="/calculator"
        noIndex={false}
      />
      <CalculatorToast message={toastMessage} />
      <div className={styles.displayArea}>
        <CalculatorHistoryDrawer
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          history={history}
          onClearHistory={clearHistory}
          onSelectHistoryItem={(item) => {
            setExpression(item.result);
            setCursorPosition(item.result.length);
            setIsEvaluated(true);
            setShowHistory(false);
          }}
        />
        <CalculatorDisplay
          expression={expression}
          cursorPosition={cursorPosition}
          setCursorPosition={setCursorPosition}
          isEvaluated={isEvaluated}
          setIsEvaluated={setIsEvaluated}
          memory={memory}
          onMemoryRecall={handleMemoryRecall}
          liveResult={liveResult}
          onCopy={handleCopy}
        />
        <CalculatorToolbar
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showScientific={showScientific}
          setShowScientific={setShowScientific}
          onCopy={handleCopy}
          onPaste={() => handlePaste()}
          canCopy={Boolean(expression || liveResult)}
          onMoveCursor={moveCursor}
          cursorPosition={cursorPosition}
          expressionLength={expression.length}
          onBackspace={handleBackspace}
        />
      </div>
      <CalculatorScientificPanel
        showScientific={showScientific}
        isDeg={isDeg}
        setIsDeg={setIsDeg}
        memory={memory}
        onMemoryClear={handleMemoryClear}
        onMemoryRecall={handleMemoryRecall}
        onMemoryAdd={handleMemoryAdd}
        onMemorySubtract={handleMemorySubtract}
        onInsert={insertAtCursor}
        onInsertEE={insertEE}
        onInsertYRoot={insertYRoot}
      />
      <CalculatorKeypad
        expression={expression}
        onClear={handleClear}
        onSmartParentheses={handleSmartParentheses}
        onInsert={insertAtCursor}
        onToggleSign={handleToggleSign}
        onCalculate={handleCalculate}
      />
    </main>
  );
};
export default Calculator;
