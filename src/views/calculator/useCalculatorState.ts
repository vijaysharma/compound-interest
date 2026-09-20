import { useState, useMemo, useEffect } from 'react';
import { evaluateExpression, extractLastOperation } from '../../utilities/calculatorHelper';
import { isErrorState } from './types';
import { useCalculatorInput } from './useCalculatorInput';
import { useCalculatorMemory } from './useCalculatorMemory';
import { useCalculatorHistory } from './useCalculatorHistory';
import { useCalculatorKeyboard } from './useCalculatorKeyboard';
export const useCalculatorState = () => {
  const input = useCalculatorInput();
  const [showScientific, setShowScientific] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('calc_show_scientific');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isDeg, setIsDeg] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem('calc_show_scientific', String(showScientific));
    } catch (e) {
      console.error(e);
    }
  }, [showScientific]);
  const liveResult = useMemo(() => {
    if (!input.expression || input.isEvaluated || isErrorState(input.expression)) return null;
    const { result, error } = evaluateExpression(input.expression, isDeg);
    if (error || !result || isErrorState(result)) return null;
    return result;
  }, [input.expression, isDeg, input.isEvaluated]);
  const memoryState = useCalculatorMemory(input.expression, liveResult, input.insertAtCursor);
  const historyState = useCalculatorHistory();
  const handleCopy = async () => {
    const textToCopy = input.isEvaluated ? input.expression : liveResult || input.expression;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setToastMessage('Copied to clipboard');
      setTimeout(() => setToastMessage(null), 2000);
    } catch {
      setToastMessage('Failed to copy');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };
  const handlePaste = async (pastedText?: string) => {
    try {
      const text = pastedText !== undefined ? pastedText : await navigator.clipboard.readText();
      if (!text) return;
      const sanitized = text
        .trim()
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/-/g, '−')
        .replace(/[^0-9+\-−×÷%^().eEπ√∛∜!sincostanloglnabs⁰¹²³⁴⁵⁶⁷⁸⁹]/gi, '');
      if (!sanitized) return;
      input.setLastOp(null);
      if (input.isEvaluated || isErrorState(input.expression)) {
        input.setExpression(sanitized);
        input.setCursorPosition(sanitized.length);
        input.setIsEvaluated(false);
      } else {
        const pos = Math.min(Math.max(0, input.cursorPosition), input.expression.length);
        const before = input.expression.slice(0, pos);
        const after = input.expression.slice(pos);
        input.setExpression(before + sanitized + after);
        input.setCursorPosition(before.length + sanitized.length);
      }
      setToastMessage('Pasted from clipboard');
      setTimeout(() => setToastMessage(null), 2000);
    } catch {
      setToastMessage('Unable to access clipboard');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };
  const handleCalculate = () => {
    if (!input.expression) return;
    if (isErrorState(input.expression)) {
      input.setExpression('');
      input.setCursorPosition(0);
      input.setIsEvaluated(false);
      return;
    }
    if (input.isEvaluated && input.lastOp) {
      const repeatExpr = `${input.expression}${input.lastOp.op}${input.lastOp.operand}`;
      const { result, error } = evaluateExpression(repeatExpr, isDeg);
      const finalRes = result !== null && !error && !isErrorState(result) ? result : 'Error';
      if (finalRes !== 'Error') historyState.addHistoryItem(repeatExpr, finalRes);
      input.setExpression(finalRes);
      input.setCursorPosition(finalRes.length);
      input.setIsEvaluated(true);
      return;
    }
    const extracted = extractLastOperation(input.expression);
    const { result, error } = evaluateExpression(input.expression, isDeg);
    const finalRes = result !== null && !error && !isErrorState(result) ? result : 'Error';
    if (finalRes !== 'Error') {
      input.setLastOp(extracted);
      historyState.addHistoryItem(input.expression, finalRes);
    }
    input.setExpression(finalRes);
    input.setCursorPosition(finalRes.length);
    input.setIsEvaluated(true);
  };
  useCalculatorKeyboard({
    handleCopy,
    handlePaste,
    insertAtCursor: input.insertAtCursor,
    insertEE: input.insertEE,
    handleCalculate,
    handleBackspace: input.handleBackspace,
    handleClear: input.handleClear,
    moveCursor: input.moveCursor,
    isEvaluated: input.isEvaluated,
    expression: input.expression,
    liveResult,
    setToastMessage,
  });
  return {
    ...input,
    ...memoryState,
    ...historyState,
    showScientific,
    setShowScientific,
    isDeg,
    setIsDeg,
    toastMessage,
    liveResult,
    handleCopy,
    handlePaste,
    handleCalculate,
  };
};
