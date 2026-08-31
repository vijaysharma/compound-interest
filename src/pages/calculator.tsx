import React, { useState, useEffect, useMemo, useRef } from 'react';
import SEOHead from '../components/SEOHead.tsx';
import { FiClock, FiDelete, FiRotateCcw, FiX } from 'react-icons/fi';
import { TbMathFunction } from 'react-icons/tb';
interface HistoryItem {
  expression: string;
  result: string;
  timestamp: string;
}
// Factorial helper
function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}
// Safe expression evaluator mimicking Android Calculator
function evaluateExpression(
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
    // Handle percentage logic like Android Calculator:
    // 1) A + B% => A + (A * (B / 100))
    // 2) A - B% => A - (A * (B / 100))
    // 3) A * B% => A * (B / 100)
    // 4) A / B% => A / (B / 100)
    // 5) Standalone B% => (B / 100)
    // Replace addition/subtraction with percent: e.g. 4 - 50%
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?|\([^()]+\)))\s*([+-])\s*(\d+(?:\.\d+)?)%/g,
      '($1 $2 ($1 * ($3 / 100)))'
    );
    // Replace multiplication/division with percent: e.g. 50 * 10%
    sanitized = sanitized.replace(
      /((?:\d+(?:\.\d+)?|\([^()]+\)))\s*([*/])\s*(\d+(?:\.\d+)?)%/g,
      '($1 $2 ($3 / 100))'
    );
    // Remaining standalone percentages
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');
    // Handle factorials e.g. 5!
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)!/g, 'fact($1)');
    // Handle constants
    sanitized = sanitized
      .replace(/π/g, '(Math.PI)')
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, '(Math.E)')
      .replace(/\^/g, '**');
    // Handle scientific functions with DEG/RAD support
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
    // Format number nicely
    const formatted = parseFloat(Number(val).toPrecision(12)).toString();
    return { result: formatted, error: false };
  } catch {
    return { result: null, error: true };
  }
}
const Calculator: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [showScientific, setShowScientific] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDeg, setIsDeg] = useState(true);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('android_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const displayRef = useRef<HTMLDivElement>(null);
  // Auto-scroll expression display to the right as characters are entered
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [expression]);
  useEffect(() => {
    try {
      localStorage.setItem('android_calc_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);
  // Live calculation preview
  const liveResult = useMemo(() => {
    if (!expression || isEvaluated) return null;
    const { result } = evaluateExpression(expression, isDeg);
    return result;
  }, [expression, isDeg, isEvaluated]);
  const appendChar = (char: string) => {
    if (isEvaluated) {
      // If user types operator right after evaluation, continue with result
      if (['+', '−', '×', '÷', '%', '^'].includes(char)) {
        setExpression((prev) => prev + char);
      } else {
        setExpression(char);
      }
      setIsEvaluated(false);
      return;
    }
    setExpression((prev) => {
      // Avoid duplicate consecutive operators
      const lastChar = prev.slice(-1);
      const isOperator = ['+', '−', '×', '÷'].includes(char);
      const lastIsOperator = ['+', '−', '×', '÷'].includes(lastChar);
      if (isOperator && lastIsOperator) {
        return prev.slice(0, -1) + char;
      }
      return prev + char;
    });
  };
  const handleSmartParentheses = () => {
    if (isEvaluated) {
      setExpression('(');
      setIsEvaluated(false);
      return;
    }
    setExpression((prev) => {
      const openCount = (prev.match(/\(/g) || []).length;
      const closeCount = (prev.match(/\)/g) || []).length;
      const lastChar = prev.slice(-1);
      // If last char is a digit, % or ), and we have unclosed parens, close it
      if (/[\d%)]/.test(lastChar) && openCount > closeCount) {
        return prev + ')';
      }
      // If last char is digit or ), and multiplying with new paren
      if (/[\d)]/.test(lastChar)) {
        return prev + '×(';
      }
      return prev + '(';
    });
  };
  const handleBackspace = () => {
    if (isEvaluated) {
      setExpression('');
      setIsEvaluated(false);
      return;
    }
    setExpression((prev) => {
      // If deleting a scientific function e.g. "sin("
      for (const fn of ['asin(', 'acos(', 'atan(', 'sin(', 'cos(', 'tan(', 'ln(', 'log(', 'abs(']) {
        if (prev.endsWith(fn)) {
          return prev.slice(0, -fn.length);
        }
      }
      return prev.slice(0, -1);
    });
  };
  const handleClear = () => {
    setExpression('');
    setIsEvaluated(false);
  };
  const handleToggleSign = () => {
    if (!expression) return;
    if (isEvaluated) {
      const val = parseFloat(expression);
      if (!isNaN(val)) {
        setExpression(String(-val));
      }
      return;
    }
    // Toggle sign of last number in expression
    setExpression((prev) => {
      const match = prev.match(/([+\-×÷(]?)(-?\d+(?:\.\d+)?)$/);
      if (!match) return prev;
      const [full, op, num] = match;
      const prefix = prev.slice(0, prev.length - full.length);
      if (num.startsWith('-')) {
        return prefix + op + num.slice(1);
      } else {
        if (op === '−' || op === '-') {
          return prefix + '+' + num;
        } else if (op === '+') {
          return prefix + '−' + num;
        }
        return prefix + op + '(-' + num + ')';
      }
    });
  };
  const handleCalculate = () => {
    if (!expression) return;
    const { result, error } = evaluateExpression(expression, isDeg);
    if (result !== null && !error) {
      // Add to history
      setHistory((prev) => [
        {
          expression,
          result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 49),
      ]);
      setExpression(result);
      setIsEvaluated(true);
    }
  };
  const formatWithCommas = (str: string) => {
    // Format numeric substrings nicely
    return str.replace(/\b\d+(\.\d+)?\b/g, (num) => {
      const parts = num.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    });
  };
  return (
    <main className="w-full max-w-sm sm:max-w-md mx-auto px-3 py-2 sm:py-4 flex flex-col min-h-[calc(100dvh-56px)] justify-between select-none">
      <SEOHead
        title="Android-Style Calculator — Free Online Basic & Scientific Calculator"
        description="Fast, institutional-grade Android-style calculator with live calculation preview, percentages (4-50%), trigonometry, logarithms, and calculation history."
        keywords="android calculator, online calculator, scientific calculator, live preview calculator, percentage calculator, math calculator"
        canonicalPath="/calculator"
        noIndex={false}
      />
      {/* Top Display Area */}
      <div className="flex-1 flex flex-col justify-end pb-3 sm:pb-4">
        {/* History Modal / Drawer */}
        {showHistory && (
          <div className="relative mb-3 bg-base-200/90 border border-base-300 rounded-2xl p-3 shadow-lg max-h-56 overflow-y-auto backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-base-300/60 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                <FiClock className="h-3.5 w-3.5" /> History
              </span>
              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="btn btn-ghost btn-xs text-error font-medium"
                    title="Clear history"
                  >
                    <FiRotateCcw className="h-3 w-3" /> Clear
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-xs opacity-50 text-center py-4">No recent calculations</p>
            ) : (
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setExpression(item.result);
                      setIsEvaluated(true);
                      setShowHistory(false);
                    }}
                    className="p-2 rounded-xl bg-base-100/70 hover:bg-base-100 cursor-pointer transition-colors text-right"
                  >
                    <p className="text-xs opacity-60 font-mono truncate">{item.expression}</p>
                    <p className="text-sm font-bold text-primary font-mono">{item.result}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Expression Display */}
        <div
          ref={displayRef}
          className="w-full overflow-x-auto whitespace-nowrap text-right py-1 px-1 scrollbar-none transition-all"
        >
          <span className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-base-content font-sans">
            {expression ? formatWithCommas(expression) : '0'}
          </span>
        </div>
        {/* Live Calculation Preview (Trailing Digits like Android) */}
        <div className="h-8 flex items-center justify-end px-1">
          {liveResult !== null && !isEvaluated ? (
            <span className="text-xl sm:text-2xl font-light text-base-content/50 font-sans tracking-tight">
              {formatWithCommas(liveResult)}
            </span>
          ) : (
            <span className="text-sm opacity-0">0</span>
          )}
        </div>
        {/* Utility Icon Bar (Android Calculator Style) */}
        <div className="flex items-center justify-between border-b border-base-300/60 pt-2 pb-2 px-2 text-base-content/70">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`btn btn-ghost btn-sm btn-circle ${showHistory ? 'btn-active text-primary' : ''}`}
              title="Calculation History"
            >
              <FiClock className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowScientific(!showScientific)}
              className={`btn btn-ghost btn-sm px-2 gap-1 font-mono text-xs ${showScientific ? 'btn-active text-primary' : ''}`}
              title="Scientific Mode Toggle"
            >
              <TbMathFunction className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-semibold">√ π e</span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleBackspace}
            className="btn btn-ghost btn-sm btn-circle text-primary hover:bg-primary/10"
            title="Backspace"
          >
            <FiDelete className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* Scientific Functions Grid (Expandable) */}
      {showScientific && (
        <div className="mb-2 p-2 bg-base-200/50 rounded-2xl border border-base-300/80 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <div className="join join-horizontal">
              <button
                type="button"
                className={`join-item btn btn-xs ${isDeg ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setIsDeg(true)}
              >
                DEG
              </button>
              <button
                type="button"
                className={`join-item btn btn-xs ${!isDeg ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setIsDeg(false)}
              >
                RAD
              </button>
            </div>
            <span className="text-[10px] uppercase font-bold opacity-50 tracking-wider">
              Scientific Functions
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
            {[
              { label: 'sin', fn: () => appendChar('sin(') },
              { label: 'cos', fn: () => appendChar('cos(') },
              { label: 'tan', fn: () => appendChar('tan(') },
              { label: 'ln', fn: () => appendChar('ln(') },
              { label: 'log', fn: () => appendChar('log(') },
              { label: 'sin⁻¹', fn: () => appendChar('asin(') },
              { label: 'cos⁻¹', fn: () => appendChar('acos(') },
              { label: 'tan⁻¹', fn: () => appendChar('atan(') },
              { label: '√', fn: () => appendChar('√(') },
              { label: 'xʸ', fn: () => appendChar('^') },
              { label: 'π', fn: () => appendChar('π') },
              { label: 'e', fn: () => appendChar('e') },
              { label: 'x!', fn: () => appendChar('!') },
              { label: '|x|', fn: () => appendChar('abs(') },
              { label: '1/x', fn: () => appendChar('1/(') },
            ].map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={btn.fn}
                className="btn btn-ghost btn-sm h-9 min-h-0 text-primary font-medium text-xs rounded-xl bg-base-100/60 hover:bg-base-100"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Main Keypad Grid (Android Calculator Circular/Pill Keypad) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 pb-2">
        {/* Row 1: C, ( ), %, ÷ */}
        <button
          type="button"
          onClick={handleClear}
          className="btn h-14 sm:h-16 rounded-full text-lg sm:text-xl font-bold bg-base-200 text-error hover:bg-error/15 border-0 shadow-none"
        >
          {expression ? 'C' : 'AC'}
        </button>
        <button
          type="button"
          onClick={handleSmartParentheses}
          className="btn h-14 sm:h-16 rounded-full text-lg sm:text-xl font-bold bg-base-200 text-primary hover:bg-primary/15 border-0 shadow-none"
        >
          ( )
        </button>
        <button
          type="button"
          onClick={() => appendChar('%')}
          className="btn h-14 sm:h-16 rounded-full text-lg sm:text-xl font-bold bg-base-200 text-primary hover:bg-primary/15 border-0 shadow-none"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => appendChar('÷')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary/15 text-primary hover:bg-primary/25 border-0 shadow-none"
        >
          ÷
        </button>
        {/* Row 2: 7, 8, 9, × */}
        {['7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => appendChar(num)}
            className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => appendChar('×')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary/15 text-primary hover:bg-primary/25 border-0 shadow-none"
        >
          ×
        </button>
        {/* Row 3: 4, 5, 6, − */}
        {['4', '5', '6'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => appendChar(num)}
            className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => appendChar('−')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary/15 text-primary hover:bg-primary/25 border-0 shadow-none"
        >
          −
        </button>
        {/* Row 4: 1, 2, 3, + */}
        {['1', '2', '3'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => appendChar(num)}
            className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => appendChar('+')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary/15 text-primary hover:bg-primary/25 border-0 shadow-none"
        >
          +
        </button>
        {/* Row 5: +/-, 0, ., = */}
        <button
          type="button"
          onClick={handleToggleSign}
          className="btn h-14 sm:h-16 rounded-full text-lg sm:text-xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
        >
          +/−
        </button>
        <button
          type="button"
          onClick={() => appendChar('0')}
          className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => appendChar('.')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
        >
          .
        </button>
        <button
          type="button"
          onClick={handleCalculate}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary text-primary-content hover:bg-primary/90 border-0 shadow-md transition-transform active:scale-95"
        >
          =
        </button>
      </div>
    </main>
  );
};
export default Calculator;
