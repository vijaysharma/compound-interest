export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('Undefined');
  if (n > 170) throw new Error('Overflow');
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}
export function nthRoot(x: number, y: number): number {
  if (y === 0) throw new Error('Undefined');
  if (x === 0) return 0;
  if (x < 0) {
    if (Math.abs(y % 2) === 1) {
      return -Math.pow(-x, 1 / y);
    }
    throw new Error('Undefined');
  }
  if (y === 2) return Math.sqrt(x);
  if (y === 3) return Math.cbrt(x);
  return Math.pow(x, 1 / y);
}
const SUP_MAP: Record<string, string> = {
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
};
const supToNum = (txt: string) =>
  txt
    .split('')
    .map((c) => SUP_MAP[c] || c)
    .join('');
export function replaceAllRoots(expr: string): string {
  let s = expr
    .replace(/∛/g, '³√')
    .replace(/∜/g, '⁴√')
    .replace(/\bcbrt\s*\(/g, '³√(')
    .replace(/\bsqrt\s*\(/g, '√(');
  let safety = 0;
  while (safety < 50) {
    safety++;
    const rootParenRegex = /([⁰¹²³⁴⁵⁶⁷⁸⁹]*)√\s*\(/;
    const match = rootParenRegex.exec(s);
    if (!match) break;
    const sup = match[1];
    const degree = sup ? supToNum(sup) : '2';
    const matchIndex = match.index;
    const openParenIndex = s.indexOf('(', matchIndex);
    let depth = 0;
    let closeParenIndex = -1;
    for (let i = openParenIndex; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0) {
          closeParenIndex = i;
          break;
        }
      }
    }
    if (closeParenIndex !== -1) {
      const inner = s.slice(openParenIndex + 1, closeParenIndex);
      const processedInner = replaceAllRoots(inner);
      const replacement = `nthRoot((${processedInner.trim() || '0'}), ${degree})`;
      s = s.slice(0, matchIndex) + replacement + s.slice(closeParenIndex + 1);
    } else {
      const inner = s.slice(openParenIndex + 1);
      const processedInner = replaceAllRoots(inner);
      const replacement = `nthRoot((${processedInner.trim() || '0'}), ${degree})`;
      s = s.slice(0, matchIndex) + replacement;
      break;
    }
  }
  s = s.replace(
    /([⁰¹²³⁴⁵⁶⁷⁸⁹]*)√\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (_, sup, num) => {
      const degree = sup ? supToNum(sup) : '2';
      return `nthRoot((${num}), ${degree})`;
    }
  );
  return s;
}
