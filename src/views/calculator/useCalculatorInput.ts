import { useState } from 'react';
import { LastOperation } from './types';
import {
  computeInsertAtCursor,
  computeYRoot,
  computeEE,
} from './calculatorInsertUtils';
import {
  computeBackspace,
  computeSmartParentheses,
  computeToggleSign,
} from './calculatorModifyUtils';
export const useCalculatorInput = () => {
  const [expression, setExpression] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [lastOp, setLastOp] = useState<LastOperation | null>(null);
  const applyMutation = (result: { nextExpression: string; nextCursor: number; nextEvaluated: boolean }) => {
    setExpression(result.nextExpression);
    setCursorPosition(result.nextCursor);
    setIsEvaluated(result.nextEvaluated);
  };
  const insertAtCursor = (char: string) => {
    setLastOp(null);
    applyMutation(computeInsertAtCursor(expression, cursorPosition, isEvaluated, char));
  };
  const insertYRoot = () => {
    setLastOp(null);
    applyMutation(computeYRoot(expression, cursorPosition, isEvaluated));
  };
  const handleSmartParentheses = () => {
    const char = computeSmartParentheses(expression, cursorPosition, isEvaluated);
    insertAtCursor(char);
  };
  const handleBackspace = () => {
    setLastOp(null);
    applyMutation(computeBackspace(expression, cursorPosition, isEvaluated));
  };
  const insertEE = () => {
    setLastOp(null);
    applyMutation(computeEE(expression, cursorPosition, isEvaluated));
  };
  const handleClear = () => {
    setExpression('');
    setCursorPosition(0);
    setIsEvaluated(false);
    setLastOp(null);
  };
  const moveCursor = (dir: 'left' | 'right') => {
    if (isEvaluated) setIsEvaluated(false);
    setCursorPosition((prev) => (dir === 'left' ? Math.max(0, prev - 1) : Math.min(expression.length, prev + 1)));
  };
  const handleToggleSign = () => {
    setLastOp(null);
    applyMutation(computeToggleSign(expression, cursorPosition, isEvaluated));
  };
  return {
    expression,
    setExpression,
    cursorPosition,
    setCursorPosition,
    isEvaluated,
    setIsEvaluated,
    lastOp,
    setLastOp,
    insertAtCursor,
    insertYRoot,
    handleSmartParentheses,
    handleBackspace,
    insertEE,
    handleClear,
    moveCursor,
    handleToggleSign,
  };
};
