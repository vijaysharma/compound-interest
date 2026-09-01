// Comprehensive, arbitrary-precision expression evaluator for Android-style Calculator

export interface HistoryItem {
  expression: string;
  result: string;
  timestamp: string;
}

export interface LastOperation {
  op: string;
  operand: string;
}

// Factorial helper with Overflow detection
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('Undefined');
  if (n > 170) throw new Error('Overflow');
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Convert superscript numbers to regular digits for uniform parsing
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
    'ʸ': 'y',
    'ˣ': 'x',
  };
  return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ʸˣ]/g, (m) => supMap[m] || m);
}

// Arbitrary-precision Decimal arithmetic (supports arbitrary exponents up to any magnitude)
export class Decimal {
  m: bigint; // unscaled integer mantissa
  e: number; // base-10 exponent: value = m * 10^e

  constructor(m: bigint | number | string, e: number) {
    this.m = BigInt(m);
    this.e = e;
    this.normalize();
  }

  normalize() {
    if (this.m === 0n) {
      this.e = 0;
      return;
    }
    while (this.m % 10n === 0n) {
      this.m /= 10n;
      this.e += 1;
    }
  }

  static fromString(str: string): Decimal {
    str = str.trim();
    const isNeg = str.startsWith('-');
    const clean = str.replace(/^[+-]/, '');

    // Handle scientific notation e.g. 8.06581751709e+67 or 1.5e-5
    const sciMatch = clean.match(/^(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
    if (sciMatch) {
      const intPart = sciMatch[1] || '0';
      const fracPart = sciMatch[2] || '';
      const exp = parseInt(sciMatch[3], 10);
      const digits = intPart + fracPart;
      const decPlaces = fracPart.length;
      let m = BigInt(digits);
      if (isNeg) m = -m;
      return new Decimal(m, exp - decPlaces);
    }

    // Handle standard decimal numbers
    const decMatch = clean.match(/^(\d+)(?:\.(\d+))?$/);
    if (decMatch) {
      const intPart = decMatch[1] || '0';
      const fracPart = decMatch[2] || '';
      const digits = intPart + fracPart;
      const decPlaces = fracPart.length;
      let m = BigInt(digits);
      if (isNeg) m = -m;
      return new Decimal(m, -decPlaces);
    }

    return new Decimal(0n, 0);
  }

  static fromNumber(n: number): Decimal {
    if (isNaN(n) || !isFinite(n)) throw new Error('Undefined');
    return Decimal.fromString(n.toString());
  }

  add(other: Decimal): Decimal {
    const diff = this.e - other.e;
    if (diff >= 0) {
      const m1 = this.m * (10n ** BigInt(diff));
      return new Decimal(m1 + other.m, other.e);
    } else {
      const m2 = other.m * (10n ** BigInt(-diff));
      return new Decimal(this.m + m2, this.e);
    }
  }

  sub(other: Decimal): Decimal {
    return this.add(new Decimal(-other.m, other.e));
  }

  mul(other: Decimal): Decimal {
    return new Decimal(this.m * other.m, this.e + other.e);
  }

  div(other: Decimal, precision = 40): Decimal {
    if (other.m === 0n) throw new Error('Undefined');
    const m = (this.m * (10n ** BigInt(precision))) / other.m;
    return new Decimal(m, this.e - other.e - precision);
  }

  toNumber(): number {
    const isNeg = this.m < 0n;
    const absM = isNeg ? -this.m : this.m;
    const s = absM.toString();
    const e = this.e;
    if (e >= 0) {
      return (isNeg ? -1 : 1) * Number(s + '0'.repeat(e));
    }
    const decPos = s.length + e;
    if (decPos > 0) {
      const str = s.slice(0, decPos) + '.' + s.slice(decPos);
      return (isNeg ? -1 : 1) * parseFloat(str);
    } else {
      const str = '0.' + '0'.repeat(-decPos) + s;
      return (isNeg ? -1 : 1) * parseFloat(str);
    }
  }

  toString(): string {
    if (this.m === 0n) return '0';
    const isNeg = this.m < 0n;
    const absM = isNeg ? -this.m : this.m;
    const s = absM.toString();
    const e = this.e;
    if (e >= 0) {
      if (e + s.length > 15) {
        const exp = s.length - 1 + e;
        let mant = s[0] + (s.length > 1 ? '.' + s.slice(1) : '');
        if (mant.length > 14) mant = mant.slice(0, 14);
        mant = mant.replace(/0+$/, '').replace(/\.$/, '');
        return (isNeg ? '-' : '') + mant + 'e+' + exp;
      }
      return (isNeg ? '-' : '') + s + '0'.repeat(e);
    }
    const decPos = s.length + e;
    if (decPos > 0) {
      let frac = s.slice(decPos);
      if (frac.length > 12) frac = frac.slice(0, 12).replace(/0+$/, '');
      return (isNeg ? '-' : '') + s.slice(0, decPos) + (frac ? '.' + frac : '');
    } else {
      let frac = '0'.repeat(-decPos) + s;
      if (frac.length > 12) {
        const num = this.toNumber();
        return parseFloat(num.toPrecision(12)).toString();
      }
      return (isNeg ? '-' : '') + '0.' + frac;
    }
  }
}

// High-precision nth-root helper: y√(x) = x^(1/y)
export function nthRoot(x: number, y: number): number {
  if (y === 0) throw new Error('Undefined');
  if (x === 0) return 0;
  if (x < 0) {
    if (Math.abs(y % 2) === 1) {
      return -Math.pow(-x, 1 / y);
    }
    throw new Error('Undefined');
  }
  return Math.pow(x, 1 / y);
}

// Extract last binary operation from expression for repeat on "="
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

// Tokenize and evaluate expression supporting arbitrary-precision Decimals, trig singularities, factorials, and y√(x)
export function evaluateExpression(
  expr: string,
  isDeg: boolean
): { result: string | null; error: boolean } {
  if (!expr || expr.trim() === '') return { result: null, error: false };

  try {
    let sanitized = normalizeSuperscripts(expr)
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '');

    // Trim trailing operators for live preview
    while (/[+\-*/^.(]$/.test(sanitized)) {
      sanitized = sanitized.slice(0, -1);
    }

    if (!sanitized) return { result: null, error: false };

    // Auto-close open parentheses for live preview
    const openCount = (sanitized.match(/\(/g) || []).length;
    const closeCount = (sanitized.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      sanitized += ')'.repeat(openCount - closeCount);
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. Percentage logic (Android Calculator formula)
    // ─────────────────────────────────────────────────────────────────
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\([^()]+\)))\s*([+-])\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)%/g,
      '($1 $2 ($1 * ($3 / 100)))'
    );
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\([^()]+\)))\s*([*/])\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)%/g,
      '($1 $2 ($3 / 100))'
    );
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)%/g, '($1 / 100)');

    // ─────────────────────────────────────────────────────────────────
    // 2. y-th root of x: y√(x) => nthRoot(x, y) e.g. 3√(27) => 3
    // ─────────────────────────────────────────────────────────────────
    sanitized = sanitized.replace(
      /(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*√\s*\(([^()]+)\)/g,
      'nthRoot(($2), $1)'
    );
    sanitized = sanitized.replace(
      /(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*√\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      'nthRoot($2, $1)'
    );
    sanitized = sanitized.replace(/√\s*\(([^()]+)\)/g, 'nthRoot(($1), 2)');
    sanitized = sanitized.replace(/√\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, 'nthRoot($1, 2)');

    // ─────────────────────────────────────────────────────────────────
    // 3. Implicit Multiplication (Parentheses, Constants & Functions)
    // ─────────────────────────────────────────────────────────────────
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*\(/g, '$1*(');
    sanitized = sanitized.replace(/\)\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ')*$1');
    sanitized = sanitized.replace(/\)\s*\(/g, ')*(');

    sanitized = sanitized.replace(/π/g, '(Math.PI)');
    sanitized = sanitized.replace(/(?<![0-9a-zA-Z.])e(?![0-9a-zA-Z+])/g, '(Math.E)');

    sanitized = sanitized.replace(/((?:\(Math\.PI\)|\(Math\.E\)))\s*(\d+|\()/g, '$1*$2');
    sanitized = sanitized.replace(/(\d+|\))\s*((?:\(Math\.PI\)|\(Math\.E\)))/g, '$1*$2');

    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\)))\s*(sin|cos|tan|asin|acos|atan|ln|log|abs|nthRoot)/g,
      '$1*$2'
    );

    // ─────────────────────────────────────────────────────────────────
    // 4. Factorials (e.g. 5! or 52! or 5000!)
    // ─────────────────────────────────────────────────────────────────
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)!/g, 'fact($1)');

    // ─────────────────────────────────────────────────────────────────
    // 5. Trigonometric Functions with Exact Undefined checks (tan(90))
    // ─────────────────────────────────────────────────────────────────
    const trigWrap = (fn: string, arg: string) => {
      if (fn === 'tan') {
        if (isDeg) {
          return `((() => { const a = (${arg}); if (Math.abs(((a % 180) + 180) % 180 - 90) < 1e-9) throw new Error('Undefined'); return Math.tan(a * Math.PI / 180); })())`;
        }
        return `((() => { const a = (${arg}); if (Math.abs(Math.cos(a)) < 1e-15) throw new Error('Undefined'); return Math.tan(a); })())`;
      }
      if (fn === 'sin') {
        return isDeg ? `Math.sin((${arg}) * Math.PI / 180)` : `Math.sin(${arg})`;
      }
      if (fn === 'cos') {
        return isDeg ? `Math.cos((${arg}) * Math.PI / 180)` : `Math.cos(${arg})`;
      }
      return `Math.${fn}(${arg})`;
    };

    const invTrigWrap = (fn: string, arg: string) => {
      if (isDeg) {
        return `((Math.${fn}(${arg})) * 180 / Math.PI)`;
      }
      return `Math.${fn}(${arg})`;
    };

    for (let iter = 0; iter < 4; iter++) {
      sanitized = sanitized
        .replace(/(?<![a-zA-Z.])asin\(([^()]+)\)/g, (_, a) => invTrigWrap('asin', a))
        .replace(/(?<![a-zA-Z.])acos\(([^()]+)\)/g, (_, a) => invTrigWrap('acos', a))
        .replace(/(?<![a-zA-Z.])atan\(([^()]+)\)/g, (_, a) => invTrigWrap('atan', a))
        .replace(/(?<![a-zA-Z.])sin\(([^()]+)\)/g, (_, a) => trigWrap('sin', a))
        .replace(/(?<![a-zA-Z.])cos\(([^()]+)\)/g, (_, a) => trigWrap('cos', a))
        .replace(/(?<![a-zA-Z.])tan\(([^()]+)\)/g, (_, a) => trigWrap('tan', a))
        .replace(/(?<![a-zA-Z.])ln\(([^()]+)\)/g, '((() => { const v = (${1}); if (v <= 0) throw new Error("Undefined"); return Math.log(v); })())')
        .replace(/(?<![a-zA-Z.])log\(([^()]+)\)/g, '((() => { const v = (${1}); if (v <= 0) throw new Error("Undefined"); return Math.log10(v); })())')
        .replace(/(?<![a-zA-Z.])abs\(([^()]+)\)/g, 'Math.abs($1)');
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. High-Precision Decimal Evaluation for arithmetic & scientific notation
    // ─────────────────────────────────────────────────────────────────
    const isDecimalEligible = /^(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[+\-*\/() ])+$/.test(sanitized);
    if (isDecimalEligible) {
      try {
        const rawTokens = sanitized.match(/(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[+\-*\/()])/g);
        if (rawTokens && rawTokens.length > 0) {
          const output: (Decimal | string)[] = [];
          const ops: string[] = [];
          const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

          let prevToken: string | null = null;
          for (let i = 0; i < rawTokens.length; i++) {
            const token = rawTokens[i];
            if (/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) {
              output.push(Decimal.fromString(token));
            } else if (token === '(') {
              ops.push(token);
            } else if (token === ')') {
              while (ops.length && ops[ops.length - 1] !== '(') {
                output.push(ops.pop()!);
              }
              ops.pop();
            } else if (['+', '-', '*', '/'].includes(token)) {
              if ((token === '-' || token === '+') && (prevToken === null || ['+', '-', '*', '/', '('].includes(prevToken))) {
                output.push(new Decimal(0n, 0));
              }
              while (ops.length && ops[ops.length - 1] !== '(' && precedence[ops[ops.length - 1]] >= precedence[token]) {
                output.push(ops.pop()!);
              }
              ops.push(token);
            }
            prevToken = token;
          }
          while (ops.length) output.push(ops.pop()!);

          const stack: Decimal[] = [];
          for (const tok of output) {
            if (tok instanceof Decimal) {
              stack.push(tok);
            } else {
              const b = stack.pop();
              const a = stack.pop();
              if (!a || !b) throw new Error('Invalid');
              if (tok === '+') stack.push(a.add(b));
              else if (tok === '-') stack.push(a.sub(b));
              else if (tok === '*') stack.push(a.mul(b));
              else if (tok === '/') stack.push(a.div(b));
            }
          }
          if (stack.length === 1) {
            return { result: stack[0].toString(), error: false };
          }
        }
      } catch (e: any) {
        if (e.message === 'Undefined') return { result: 'Undefined', error: false };
      }
    }

    sanitized = sanitized.replace(/\^/g, '**');

    // Standard high-level execution context with math helpers
    const evaluator = new Function(
      'fact',
      'nthRoot',
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

    const val = evaluator(factorial, nthRoot);
    if (val === null) return { result: null, error: false };

    // Format number nicely
    const formatted = parseFloat(Number(val).toPrecision(12)).toString();
    return { result: formatted, error: false };
  } catch (err: any) {
    if (err.message === 'Undefined') {
      return { result: 'Undefined', error: false };
    }
    if (err.message === 'Overflow') {
      return { result: 'Overflow', error: false };
    }
    return { result: null, error: true };
  }
}
