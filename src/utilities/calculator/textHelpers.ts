import type { LastOperation } from './types';
export const toSuperscript = (str: string): string => {
  const map: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return str
    .split('')
    .map((c) => map[c] || c)
    .join('');
};
export function normalizeSuperscripts(s: string): string {
  const supMap: Record<string, string> = {
    '⁰': '0',
    '¹': '1',
    '²': '2',
    '³': '3',
    '⁴': '4',
    '⁵': '5',
    '⁶': '6',
    '⁷': '7',
    '⁸': '8',
    '⁹': '9',
    ʸ: 'y',
    ˣ: 'x',
  };
  return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ʸˣ]/g, (m) => supMap[m] || m);
}
export function extractLastOperation(expr: string): LastOperation | null {
  if (!expr) return null;
  const sanitized = expr.trim();
  const match = sanitized.match(/([+\-×÷^])\s*([0-9.]+(?:[eE][+-]?\d+)?%?|[πe]|\([^()]+\))$/);
  if (match) {
    return {
      op: match[1],
      operand: match[2],
    };
  }
  return null;
}
