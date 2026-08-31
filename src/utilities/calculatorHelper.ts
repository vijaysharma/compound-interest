// Helper functions and evaluator for Android Calculator

export interface HistoryItem {
  expression: string;
  result: string;
  timestamp: string;
}

export interface LastOperation {
  op: string;
  operand: string;
}

// Factorial helper
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Extract last binary operation from expression, e.g. "5 + 3" => { op: "+", operand: "3" }
export function extractLastOperation(expr: string): LastOperation | null {
  if (!expr) return null;
  const sanitized = expr.trim();
  // Match trailing operator and number/percentage/constant, e.g. "+ 3", "− 50%", "× 2", "÷ 4"
  const match = sanitized.match(/([+\-×÷^])\s*([0-9.]+%?|[πe]|\([^()]+\))$/);
  if (match) {
    return {
      op: match[1],
      operand: match[2],
    };
  }
  return null;
}

// Safe expression evaluator supporting implicit operations, nth-roots, percentages, and scientific functions
export function evaluateExpression(
  expr: string,
  isDeg: boolean
): { result: string | null; error: boolean } {
  if (!expr || expr.trim() === '') return { result: null, error: false };

  try {
    let sanitized = expr
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
    // A + B% => A + (A * (B / 100))
    // A - B% => A - (A * (B / 100))
    // A * B% => A * (B / 100)
    // A / B% => A / (B / 100)
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?|\([^()]+\)))\s*([+-])\s*(\d+(?:\.\d+)?)%/g,
      '($1 $2 ($1 * ($3 / 100)))'
    );
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?|\([^()]+\)))\s*([*/])\s*(\d+(?:\.\d+)?)%/g,
      '($1 $2 ($3 / 100))'
    );
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');

    // ─────────────────────────────────────────────────────────────────
    // 2. Implicit Operations (Multiplication & x√y)
    // ─────────────────────────────────────────────────────────────────
    // Number followed by parenthesis: 2(3+4) => 2*(3+4)
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*\(/g, '$1*(');

    // Parenthesis followed by number: (3+4)2 => (3+4)*2
    sanitized = sanitized.replace(/\)\s*(\d+(?:\.\d+)?)/g, ')*$1');

    // Parenthesis followed by parenthesis: (2+3)(4+5) => (2+3)*(4+5)
    sanitized = sanitized.replace(/\)\s*\(/g, ')*(');

    // Number or ) followed by constant [πe]: 2π => 2*π, 3e => 3*e, (2+3)π => (2+3)*π
    sanitized = sanitized.replace(/((?:\d+(?:\.\d+)?|\)))\s*([πe])/g, '$1*$2');

    // Constant [πe] followed by Number or (: π(4) => π*4, π2 => π*2
    sanitized = sanitized.replace(/([πe])\s*((?:\d+(?:\.\d+)?|\())/g, '$1*$2');

    // Implicit operation: x times square root of y (e.g. 4√9, 2√(16), (2+3)√4)
    // and Number / ) / constant before scientific function (2sin(30), 4√9, 3ln(5))
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?|\)|[πe]))\s*(√|sin|cos|tan|asin|acos|atan|ln|log|abs)/g,
      '$1*$2'
    );

    // ─────────────────────────────────────────────────────────────────
    // 3. Factorials & Constants
    // ─────────────────────────────────────────────────────────────────
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)!/g, 'fact($1)');
    sanitized = sanitized
      .replace(/π/g, '(Math.PI)')
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, '(Math.E)')
      .replace(/\^/g, '**');

    // ─────────────────────────────────────────────────────────────────
    // 4. Square Roots & Scientific Functions (DEG/RAD)
    // ─────────────────────────────────────────────────────────────────
    const trigWrap = (fn: string, arg: string) => {
      if (isDeg) {
        return `Math.${fn}((${arg}) * Math.PI / 180)`;
      }
      return `Math.${fn}(${arg})`;
    };

    const invTrigWrap = (fn: string, arg: string) => {
      if (isDeg) {
        return `((Math.${fn}(${arg})) * 180 / Math.PI)`;
      }
      return `Math.${fn}(${arg})`;
    };

    // Replace functions iteratively to handle nesting
    for (let iter = 0; iter < 4; iter++) {
      sanitized = sanitized
        .replace(/asin\(([^()]+)\)/g, (_, a) => invTrigWrap('asin', a))
        .replace(/acos\(([^()]+)\)/g, (_, a) => invTrigWrap('acos', a))
        .replace(/atan\(([^()]+)\)/g, (_, a) => invTrigWrap('atan', a))
        .replace(/sin\(([^()]+)\)/g, (_, a) => trigWrap('sin', a))
        .replace(/cos\(([^()]+)\)/g, (_, a) => trigWrap('cos', a))
        .replace(/tan\(([^()]+)\)/g, (_, a) => trigWrap('tan', a))
        .replace(/ln\(([^()]+)\)/g, 'Math.log($1)')
        .replace(/log\(([^()]+)\)/g, 'Math.log10($1)')
        .replace(/√\(([^()]+)\)/g, 'Math.sqrt($1)')
        .replace(/√(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)')
        .replace(/abs\(([^()]+)\)/g, 'Math.abs($1)');
    }

    // Safe execution context
    const evaluator = new Function(
      'fact',
      `try { 
        const res = (${sanitized}); 
        if (typeof res !== 'number' || isNaN(res) || !isFinite(res)) return null;
        return res;
      } catch(e) { return null; }`
    );

    const val = evaluator(factorial);
    if (val === null) return { result: null, error: false };

    // Format number cleanly
    const formatted = parseFloat(Number(val).toPrecision(12)).toString();
    return { result: formatted, error: false };
  } catch {
    return { result: null, error: true };
  }
}
