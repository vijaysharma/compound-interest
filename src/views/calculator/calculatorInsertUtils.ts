import { toSuperscript } from '../../utilities/calculatorHelper';
import { isErrorState } from './types';
export interface InputMutationResult {
  nextExpression: string;
  nextCursor: number;
  nextEvaluated: boolean;
}
export const computeInsertAtCursor = (
  expression: string,
  cursorPosition: number,
  isEvaluated: boolean,
  char: string
): InputMutationResult => {
  if (isErrorState(expression)) {
    if (['+', '−', '×', '÷', '%', '^'].includes(char)) {
      return { nextExpression: '', nextCursor: 0, nextEvaluated: false };
    }
    const initial = char === '.' ? '0.' : char;
    return { nextExpression: initial, nextCursor: initial.length, nextEvaluated: false };
  }
  if (isEvaluated) {
    if (['+', '−', '×', '÷', '%', '^'].includes(char)) {
      const next = expression + char;
      return { nextExpression: next, nextCursor: next.length, nextEvaluated: false };
    }
    const initial = char === '.' ? '0.' : char;
    return { nextExpression: initial, nextCursor: initial.length, nextEvaluated: false };
  }
  const pos = Math.min(Math.max(0, cursorPosition), expression.length);
  const before = expression.slice(0, pos);
  const after = expression.slice(pos);
  let insertChar = char;
  if (char === '.') {
    const match = before.match(/(\d*(?:\.\d*)?)$/);
    if (match && match[1].includes('.')) {
      return { nextExpression: expression, nextCursor: pos, nextEvaluated: false };
    }
    if (!match || match[1] === '') insertChar = '0.';
  }
  const isOperator = ['+', '−', '×', '÷', '^'].includes(insertChar);
  const lastIsOperator = ['+', '−', '×', '÷', '^'].includes(before.slice(-1));
  let newBefore = before;
  if (isOperator && lastIsOperator) {
    if (!(insertChar === '−' && ['×', '÷', '^'].includes(before.slice(-1)))) {
      newBefore = before.slice(0, -1);
    }
  }
  return {
    nextExpression: newBefore + insertChar + after,
    nextCursor: newBefore.length + insertChar.length,
    nextEvaluated: false,
  };
};
export const computeYRoot = (
  expression: string,
  cursorPosition: number,
  isEvaluated: boolean
): InputMutationResult => {
  if (isEvaluated || isErrorState(expression)) {
    return { nextExpression: '³√(', nextCursor: 3, nextEvaluated: false };
  }
  const pos = Math.min(Math.max(0, cursorPosition), expression.length);
  const before = expression.slice(0, pos);
  const after = expression.slice(pos);
  const match = before.match(/(\d+)$/);
  if (match) {
    const num = match[1];
    const prefix = before.slice(0, before.length - num.length);
    const sup = toSuperscript(num);
    return {
      nextExpression: prefix + sup + '√(' + after,
      nextCursor: prefix.length + sup.length + 2,
      nextEvaluated: false,
    };
  }
  return {
    nextExpression: before + '³√(' + after,
    nextCursor: before.length + 3,
    nextEvaluated: false,
  };
};
export const computeEE = (
  expression: string,
  cursorPosition: number,
  isEvaluated: boolean
): InputMutationResult => {
  if (isEvaluated || isErrorState(expression)) {
    return { nextExpression: '1E', nextCursor: 2, nextEvaluated: false };
  }
  const pos = Math.min(Math.max(0, cursorPosition), expression.length);
  const before = expression.slice(0, pos);
  const after = expression.slice(pos);
  const lastChar = before.slice(-1);
  const token = /\d|\./.test(lastChar) || lastChar === 'e' || lastChar === 'π' || lastChar === ')' ? 'E' : '1E';
  return {
    nextExpression: before + token + after,
    nextCursor: before.length + token.length,
    nextEvaluated: false,
  };
};
