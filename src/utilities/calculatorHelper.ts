import {
  factorial,
  nthRoot,
  replaceAllRoots,
} from './calculator/mathFns';
import {
  log10,
  ln,
  sinFn,
  cosFn,
  tanFn,
  asinFn,
  acosFn,
  atanFn,
  acoshFn,
  atanhFn,
} from './calculator/trigFns';
import { tryDecimalEvaluation } from './calculator/decimalEval';
export type { HistoryItem, LastOperation } from './calculator/types';
export {
  toSuperscript,
  normalizeSuperscripts,
  extractLastOperation,
} from './calculator/textHelpers';
export { Decimal } from './calculator/decimal';
export { factorial, nthRoot, replaceAllRoots } from './calculator/mathFns';
const FUNC_LIST = 'sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|ln|log|abs|nthRoot';
function sanitizeExpression(expr: string): string {
  let s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, '');
  while (/[+\-*/^.(√∛∜]$/.test(s) || /E[+-]?$/.test(s)) {
    s = s.replace(/E[+-]?$/, '').replace(/[+\-*/^.(√∛∜]$/, '');
  }
  const openCount = (s.match(/\(/g) || []).length;
  const closeCount = (s.match(/\)/g) || []).length;
  if (openCount > closeCount) s += ')'.repeat(openCount - closeCount);
  s = s.replace(/((?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\([^()]+\)))\s*([+-])\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)%/g, '($1 $2 ($1 * ($3 / 100)))');
  s = s.replace(/((?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\([^()]+\)))\s*([*/])\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)%/g, '($1 $2 ($3 / 100))');
  s = s.replace(/(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\([^()]+\))%/g, '($1 / 100)');
  s = replaceAllRoots(s);
  const sciMap: string[] = [];
  s = s.replace(/\b\d+(?:\.\d+)?E[+-]?\d+\b/g, (m) => {
    sciMap.push(m.toLowerCase());
    return `__SCI_${sciMap.length - 1}__`;
  });
  s = s.replace(/(?<![a-zA-Z0-9_])E([+-]?\d+)\b/g, (_, p1) => {
    sciMap.push(`1e${p1}`);
    return `__SCI_${sciMap.length - 1}__`;
  });
  s = s.replace(/(\d+(?:\.\d+)?)\s*e/g, '$1*Math.E');
  s = s.replace(/e\s*(\d+(?:\.\d+)?)/g, 'Math.E*$1');
  s = s.replace(/(?<![a-zA-Z0-9_])e(?![a-zA-Z0-9_])/g, 'Math.E');
  s = s.replace(/π/g, 'Math.PI');
  s = s.replace(/__SCI_(\d+)__/g, (_, idx) => sciMap[Number(idx)]);
  s = s.replace(/(\d+(?:\.\d+)?)!/g, 'fact($1)');
  s = s.replace(/(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*\(/g, '$1*(');
  s = s.replace(/\)\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ')*$1');
  s = s.replace(/\)\s*\(/g, ')*(');
  s = s.replace(/((?:Math\.PI|Math\.E))\s*(\d+|\()/g, '$1*$2');
  s = s.replace(/(\d+|\))\s*((?:Math\.PI|Math\.E))/g, '$1*$2');
  s = s.replace(/((?:Math\.PI|Math\.E))\s*((?:Math\.PI|Math\.E))/g, '$1*$2');
  s = s.replace(new RegExp('((?:\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|\\)|Math\\.PI|Math\\.E))\\s*(' + FUNC_LIST + ')', 'g'), '$1*$2');
  s = s.replace(new RegExp('\\)\\s*(' + FUNC_LIST + ')', 'g'), ')*$1');
  s = s.replace(/(?<![a-zA-Z.])log\(/g, 'log10(');
  s = s.replace(/(?<![a-zA-Z.])sin\(/g, 'sinFn(');
  s = s.replace(/(?<![a-zA-Z.])cos\(/g, 'cosFn(');
  s = s.replace(/(?<![a-zA-Z.])tan\(/g, 'tanFn(');
  s = s.replace(/(?<![a-zA-Z.])asin\(/g, 'asinFn(');
  s = s.replace(/(?<![a-zA-Z.])acos\(/g, 'acosFn(');
  s = s.replace(/(?<![a-zA-Z.])atan\(/g, 'atanFn(');
  s = s.replace(/(?<![a-zA-Z.])sinh\(/g, 'Math.sinh(');
  s = s.replace(/(?<![a-zA-Z.])cosh\(/g, 'Math.cosh(');
  s = s.replace(/(?<![a-zA-Z.])tanh\(/g, 'Math.tanh(');
  s = s.replace(/(?<![a-zA-Z.])asinh\(/g, 'Math.asinh(');
  s = s.replace(/(?<![a-zA-Z.])acosh\(/g, 'acoshFn(');
  s = s.replace(/(?<![a-zA-Z.])atanh\(/g, 'atanhFn(');
  s = s.replace(/(?<![a-zA-Z.])abs\(/g, 'Math.abs(');
  s = s.replace(/\^/g, '**');
  return s;
}
export function evaluateExpression(expr: string, isDeg: boolean): { result: string | null; error: boolean } {
  if (!expr || expr.trim() === '') return { result: null, error: false };
  try {
    const sanitized = sanitizeExpression(expr);
    if (!sanitized) return { result: null, error: false };
    const decimalResult = tryDecimalEvaluation(sanitized);
    if (decimalResult.handled) {
      return { result: decimalResult.result, error: false };
    }
    const strippedCheck = sanitized
      .replace(/\b(Math\.(?:E|PI|sinh|cosh|tanh|asinh|abs)|log10|ln|sinFn|cosFn|tanFn|asinFn|acosFn|atanFn|acoshFn|atanhFn|nthRoot|fact)\b/g, '')
      .replace(/\b[eE][+-]?\d+\b/g, '')
      .replace(/[\d.+\-*/%^(),\s]/g, '');
    if (strippedCheck.length > 0) return { result: null, error: true };
    const evaluator = new Function(
      'log10', 'ln', 'sinFn', 'cosFn', 'tanFn', 'asinFn', 'acosFn', 'atanFn', 'acoshFn', 'atanhFn', 'nthRoot', 'fact',
      `try {
        const res = (${sanitized});
        if (res === Infinity || res === -Infinity) throw new Error('Undefined');
        if (typeof res !== 'number' || isNaN(res)) throw new Error('Undefined');
        return res;
      } catch(e) {
        if (e.message === 'Overflow' || e.message === 'Undefined') throw e;
        return null;
      }`
    );
    const val = evaluator(
      log10, ln, (v: number) => sinFn(v, isDeg), (v: number) => cosFn(v, isDeg),
      (v: number) => tanFn(v, isDeg), (v: number) => asinFn(v, isDeg), (v: number) => acosFn(v, isDeg),
      (v: number) => atanFn(v, isDeg), acoshFn, atanhFn, nthRoot, factorial
    );
    if (val === null) return { result: null, error: false };
    const formatted = parseFloat(Number(val).toPrecision(12)).toString();
    return { result: formatted, error: false };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Undefined') return { result: 'Undefined', error: false };
      if (err.message === 'Overflow') return { result: 'Overflow', error: false };
    }
    return { result: null, error: true };
  }
}
