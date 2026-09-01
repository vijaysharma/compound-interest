// Comprehensive, high-precision expression evaluator for Android-style Calculator

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

// Arbitrary-precision Decimal arithmetic using BigInt (60 decimal places of precision)
const SCALE = 60;
const BASE = 10n ** BigInt(SCALE);

export class Decimal {
  val: bigint; // scaled by 10^SCALE

  constructor(val: bigint) {
    this.val = val;
  }

  static fromNumber(n: number): Decimal {
    if (isNaN(n) || !isFinite(n)) throw new Error('Undefined');
    return Decimal.fromString(n.toString());
  }

  static fromString(str: string): Decimal {
    str = str.trim();
    if (!str) return new Decimal(0n);

    // Handle scientific exponential notation e.g. 1.18059162073e+21, 5e-3, 3.2E4
    const sciMatch = str.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))[eE]([+-]?\d+)$/);
    if (sciMatch) {
      const baseStr = sciMatch[1];
      const exp = parseInt(sciMatch[2], 10);
      const isNeg = baseStr.startsWith('-');
      const cleanBase = baseStr.replace(/^[+-]/, '');
      const parts = cleanBase.split('.');
      const intPart = parts[0] || '0';
      const fracPart = parts[1] || '';

      const totalDigits = intPart + fracPart;
      const decPlaces = fracPart.length;
      const effectiveExp = exp - decPlaces;

      let big = BigInt(totalDigits);
      if (isNeg) big = -big;

      const shift = BigInt(effectiveExp) + BigInt(SCALE);
      if (shift >= 0n) {
        return new Decimal(big * (10n ** shift));
      } else {
        return new Decimal(big / (10n ** (-shift)));
      }
    }

    const isNeg = str.startsWith('-');
    const clean = str.replace(/^[+-]/, '');
    const parts = clean.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';

    const digits = intPart + fracPart;
    const decPlaces = fracPart.length;
    let big = BigInt(digits);
    if (isNeg) big = -big;

    const shift = BigInt(SCALE - decPlaces);
    if (shift >= 0n) {
      return new Decimal(big * (10n ** shift));
    } else {
      return new Decimal(big / (10n ** (-shift)));
    }
  }

  add(other: Decimal): Decimal {
    return new Decimal(this.val + other.val);
  }

  sub(other: Decimal): Decimal {
    return new Decimal(this.val - other.val);
  }

  mul(other: Decimal): Decimal {
    return new Decimal((this.val * other.val) / BASE);
  }

  div(other: Decimal): Decimal {
    if (other.val === 0n) throw new Error('Undefined');
    return new Decimal((this.val * BASE) / other.val);
  }

  pow(exp: number): Decimal {
    if (Number.isInteger(exp) && Math.abs(exp) <= 1000) {
      if (exp === 0) return new Decimal(BASE);
      let p = Math.abs(exp);
      let base: Decimal = this;
      let result = new Decimal(BASE);
      while (p > 0) {
        if (p % 2 === 1) result = result.mul(base);
        base = base.mul(base);
        p = Math.floor(p / 2);
      }
      return exp < 0 ? new Decimal(BASE).div(result) : result;
    }
    const floatRes = Math.pow(this.toNumber(), exp);
    if (isNaN(floatRes)) throw new Error('Undefined');
    if (!isFinite(floatRes)) throw new Error('Overflow');
    return Decimal.fromNumber(floatRes);
  }

  toNumber(): number {
    const isNeg = this.val < 0n;
    const absVal = isNeg ? -this.val : this.val;
    const intPart = absVal / BASE;
    const fracPart = absVal % BASE;
    const fracStr = fracPart.toString().padStart(SCALE, '0');
    const floatStr = (isNeg ? '-' : '') + intPart.toString() + '.' + fracStr;
    return parseFloat(floatStr);
  }

  toString(): string {
    const isNeg = this.val < 0n;
    const absVal = isNeg ? -this.val : this.val;
    const intPart = absVal / BASE;
    const fracPart = absVal % BASE;

    if (fracPart === 0n) {
      return (isNeg ? '-' : '') + intPart.toString();
    }

    let fracStr = fracPart.toString().padStart(SCALE, '0').replace(/0+$/, '');
    if (intPart === 0n && fracStr.length > 12) {
      const num = this.toNumber();
      return parseFloat(num.toPrecision(12)).toString();
    }
    if (fracStr.length > 12) {
      fracStr = fracStr.slice(0, 12).replace(/0+$/, '');
    }
    return (isNeg ? '-' : '') + intPart.toString() + (fracStr ? '.' + fracStr : '');
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

// Tokenize and evaluate expression supporting BigInt decimals, trig singularities, factorials, and y√(x)
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
    // Handle y√(x) with parentheses: 3√(27) => nthRoot(27, 3)
    sanitized = sanitized.replace(
      /(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*√\s*\(([^()]+)\)/g,
      'nthRoot(($2), $1)'
    );
    // Handle y√x without parentheses: 3√27 => nthRoot(27, 3)
    sanitized = sanitized.replace(
      /(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*√\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      'nthRoot($2, $1)'
    );
    // Handle standard √(x) when no leading index y: √(25) => nthRoot(25, 2)
    sanitized = sanitized.replace(/√\s*\(([^()]+)\)/g, 'nthRoot(($1), 2)');
    sanitized = sanitized.replace(/√\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, 'nthRoot($1, 2)');

    // ─────────────────────────────────────────────────────────────────
    // 3. Implicit Multiplication (Parentheses, Constants & Functions)
    // ─────────────────────────────────────────────────────────────────
    // Number followed by parenthesis: 2(3+4) => 2*(3+4)
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*\(/g, '$1*(');
    // Parenthesis followed by number: (3+4)2 => (3+4)*2
    sanitized = sanitized.replace(/\)\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ')*$1');
    // Parenthesis followed by parenthesis: (2+3)(4+5) => (2+3)*(4+5)
    sanitized = sanitized.replace(/\)\s*\(/g, ')*(');

    // Standalone constants [πe] (DO NOT touch exponent 'e' in scientific numbers!)
    sanitized = sanitized.replace(/π/g, '(Math.PI)');
    // Only replace standalone 'e' (Euler's number) not followed/preceded by a digit
    sanitized = sanitized.replace(/(?<![0-9a-zA-Z.])e(?![0-9a-zA-Z+])/g, '(Math.E)');

    // Constant followed by Number or (: π(4) => π*4
    sanitized = sanitized.replace(/((?:\(Math\.PI\)|\(Math\.E\)))\s*(\d+|\()/g, '$1*$2');
    sanitized = sanitized.replace(/(\d+|\))\s*((?:\(Math\.PI\)|\(Math\.E\)))/g, '$1*$2');

    // Number or ) before scientific functions
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\)))\s*(sin|cos|tan|asin|acos|atan|ln|log|abs|nthRoot)/g,
      '$1*$2'
    );

    // ─────────────────────────────────────────────────────────────────
    // 4. Factorials (e.g. 5! or 5000!)
    // ─────────────────────────────────────────────────────────────────
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)!/g, 'fact($1)');
    sanitized = sanitized.replace(/\^/g, '**');

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

    // Replace functions iteratively
    for (let iter = 0; iter < 4; iter++) {
      sanitized = sanitized
        .replace(/asin\(([^()]+)\)/g, (_, a) => invTrigWrap('asin', a))
        .replace(/acos\(([^()]+)\)/g, (_, a) => invTrigWrap('acos', a))
        .replace(/atan\(([^()]+)\)/g, (_, a) => invTrigWrap('atan', a))
        .replace(/sin\(([^()]+)\)/g, (_, a) => trigWrap('sin', a))
        .replace(/cos\(([^()]+)\)/g, (_, a) => trigWrap('cos', a))
        .replace(/tan\(([^()]+)\)/g, (_, a) => trigWrap('tan', a))
        .replace(/ln\(([^()]+)\)/g, '((() => { const v = (${1}); if (v <= 0) throw new Error("Undefined"); return Math.log(v); })())')
        .replace(/log\(([^()]+)\)/g, '((() => { const v = (${1}); if (v <= 0) throw new Error("Undefined"); return Math.log10(v); })())')
        .replace(/abs\(([^()]+)\)/g, 'Math.abs($1)');
    }

    // Check division by zero: replace / 0 with check
    sanitized = sanitized.replace(
      /\/([0-9.]+(?:[eE][+-]?\d+)?|\([^()]+\))/g,
      `((d) => { if (d === 0) throw new Error("Undefined"); return 1 / d; })(($1))`
    );
    // Replace trailing * 1/d with division
    sanitized = sanitized.replace(/\* \(\(d\) =>/g, '* ((d) =>');

    // ─────────────────────────────────────────────────────────────────
    // 6. High-Precision Evaluation / Decimal Solver
    // ─────────────────────────────────────────────────────────────────
    // First, try Decimal evaluation if expression is linear additive / scientific arithmetic
    // e.g. 1.18059162073e+21+2-1.18059162073e+21
    const isLinearDecimal = /^[+-]?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[+\-*\/() ])+$/.test(sanitized) &&
      !/(?:fact|Math|nthRoot)/.test(sanitized);

    if (isLinearDecimal) {
      try {
        const tokens = sanitized.match(/([+-]?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|[+\-*\/()])/g);
        if (tokens && tokens.length > 0) {
          // Infix to RPN Shunting-Yard for Decimal
          const output: (Decimal | string)[] = [];
          const ops: string[] = [];
          const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

          let prevToken: string | null = null;
          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (/^[+-]?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/.test(token)) {
              output.push(Decimal.fromString(token));
            } else if (token === '(') {
              ops.push(token);
            } else if (token === ')') {
              while (ops.length && ops[ops.length - 1] !== '(') {
                output.push(ops.pop()!);
              }
              ops.pop();
            } else if (['+', '-', '*', '/'].includes(token)) {
              // Unary minus handling
              if ((token === '-' || token === '+') && (prevToken === null || ['+', '-', '*', '/', '('].includes(prevToken))) {
                output.push(Decimal.fromString('0'));
              }
              while (ops.length && ops[ops.length - 1] !== '(' && precedence[ops[ops.length - 1]] >= precedence[token]) {
                output.push(ops.pop()!);
              }
              ops.push(token);
            }
            prevToken = token;
          }
          while (ops.length) output.push(ops.pop()!);

          // Evaluate RPN with Decimal
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
        // Fallback to standard evaluator below
      }
    }

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
        if (e.message === 'Overflow') throw e;
        if (e.message === 'Undefined') throw e;
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
