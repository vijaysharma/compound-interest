import { isErrorState } from './types';
import { InputMutationResult } from './calculatorInsertUtils';
export const SCIENTIFIC_BACKSPACE_FNS = [
  'asinh(',
  'acosh(',
  'atanh(',
  'sinh(',
  'cosh(',
  'tanh(',
  'asin(',
  'acos(',
  'atan(',
  'sin(',
  'cos(',
  'tan(',
  'ln(',
  'log(',
  'abs(',
  '1/(',
  '∛(',
  '³√(',
  '²√(',
  '⁴√(',
  '⁵√(',
  '√(',
];
export const computeBackspace = (
  expression: string,
  cursorPosition: number,
  isEvaluated: boolean
): InputMutationResult => {
  if (isEvaluated || isErrorState(expression)) {
    return { nextExpression: '', nextCursor: 0, nextEvaluated: false };
  }
  if (cursorPosition === 0 || !expression) {
    return { nextExpression: expression, nextCursor: cursorPosition, nextEvaluated: false };
  }
  const pos = Math.min(Math.max(0, cursorPosition), expression.length);
  const before = expression.slice(0, pos);
  const after = expression.slice(pos);
  for (const fn of SCIENTIFIC_BACKSPACE_FNS) {
    if (before.endsWith(fn)) {
      const newBefore = before.slice(0, -fn.length);
      return { nextExpression: newBefore + after, nextCursor: newBefore.length, nextEvaluated: false };
    }
  }
  const newBefore = before.slice(0, -1);
  return { nextExpression: newBefore + after, nextCursor: newBefore.length, nextEvaluated: false };
};
export const computeSmartParentheses = (
  expression: string,
  cursorPosition: number,
  isEvaluated: boolean
): string => {
  if (isEvaluated || isErrorState(expression)) return '(';
  const pos = Math.min(Math.max(0, cursorPosition), expression.length);
  const before = expression.slice(0, pos);
  const openCount = (expression.match(/\(/g) || []).length;
  const closeCount = (expression.match(/\)/g) || []).length;
  const lastChar = before.slice(-1);
  return /[\d%)]/.test(lastChar) && openCount > closeCount ? ')' : '(';
};
export const computeToggleSign = (
  expression: string,
  cursorPosition: number,
  isEvaluated: boolean
): InputMutationResult => {
  if (!expression || isErrorState(expression)) {
    return { nextExpression: '', nextCursor: 0, nextEvaluated: false };
  }
  if (isEvaluated) {
    const val = parseFloat(expression);
    if (!isNaN(val)) {
      const toggled = String(-val);
      return { nextExpression: toggled, nextCursor: toggled.length, nextEvaluated: false };
    }
    return { nextExpression: expression, nextCursor: cursorPosition, nextEvaluated: false };
  }
  const pos = Math.min(Math.max(0, cursorPosition), expression.length);
  const before = expression.slice(0, pos);
  const after = expression.slice(pos);
  const match = before.match(/([+\-×÷(]?)(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return { nextExpression: expression, nextCursor: cursorPosition, nextEvaluated: false };
  }
  const [full, op, num] = match;
  const prefix = before.slice(0, before.length - full.length);
  let replaced: string;
  if (num.startsWith('-')) {
    replaced = prefix + op + num.slice(1);
  } else {
    if (op === '−' || op === '-') {
      replaced = prefix + '+' + num;
    } else if (op === '+') {
      replaced = prefix + '−' + num;
    } else {
      replaced = prefix + op + '(-' + num + ')';
    }
  }
  return {
    nextExpression: replaced + after,
    nextCursor: replaced.length,
    nextEvaluated: false,
  };
};
