import React, { useState, useEffect, useMemo, useRef } from 'react';
import SEOHead from '../components/SEOHead.tsx';
import {
  FiClock,
  FiDelete,
  FiRotateCcw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiClipboard,
  FiCheck,
} from 'react-icons/fi';
import { TbMathFunction } from 'react-icons/tb';
import {
  evaluateExpression,
  extractLastOperation,
  toSuperscript,
  type HistoryItem,
  type LastOperation,
} from '../utilities/calculatorHelper';
const Calculator: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showScientific, setShowScientific] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('calc_show_scientific');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isDeg, setIsDeg] = useState(true);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [lastOp, setLastOp] = useState<LastOperation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [memory, setMemory] = useState<number>(() => {
    try {
      const saved =
        localStorage.getItem('calc_memory') || localStorage.getItem('android_calc_memory');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved =
        localStorage.getItem('calc_history') || localStorage.getItem('android_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const displayContainerRef = useRef<HTMLDivElement>(null);
  // Persist history, memory & scientific view state
  useEffect(() => {
    try {
      localStorage.setItem('calc_show_scientific', String(showScientific));
    } catch (e) {
      console.error(e);
    }
  }, [showScientific]);
  useEffect(() => {
    try {
      localStorage.setItem('calc_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);
  useEffect(() => {
    try {
      localStorage.setItem('calc_memory', String(memory));
    } catch (e) {
      console.error(e);
    }
  }, [memory]);
  // Live calculation preview
  const liveResult = useMemo(() => {
    if (!expression || isEvaluated) return null;
    const { result } = evaluateExpression(expression, isDeg);
    return result;
  }, [expression, isDeg, isEvaluated]);
  // Copy to clipboard
  const handleCopy = async () => {
    const textToCopy = isEvaluated ? expression : liveResult || expression;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setToastMessage('Copied to clipboard');
      setTimeout(() => setToastMessage(null), 2000);
    } catch {
      setToastMessage('Failed to copy');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };
  // Paste from clipboard or string
  const handlePaste = async (pastedText?: string) => {
    try {
      const text = pastedText !== undefined ? pastedText : await navigator.clipboard.readText();
      if (!text) return;
      // Clean & sanitize pasted math expression
      const sanitized = text
        .trim()
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/-/g, '−')
        .replace(/[^0-9+\-−×÷%^().eEπ√!sincostanloglnabs⁰¹²³⁴⁵⁶⁷⁸⁹]/gi, '');
      if (!sanitized) return;
      setLastOp(null);
      if (isEvaluated) {
        setExpression(sanitized);
        setCursorPosition(sanitized.length);
        setIsEvaluated(false);
      } else {
        const pos = Math.min(Math.max(0, cursorPosition), expression.length);
        const before = expression.slice(0, pos);
        const after = expression.slice(pos);
        const nextExpr = before + sanitized + after;
        setExpression(nextExpr);
        setCursorPosition(before.length + sanitized.length);
      }
      setToastMessage('Pasted from clipboard');
      setTimeout(() => setToastMessage(null), 2000);
    } catch {
      setToastMessage('Unable to access clipboard');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };
  // Insert character or token at cursor position (Inline CRUD)
  const insertAtCursor = (char: string) => {
    setLastOp(null); // Reset repeat operation on new input
    if (isEvaluated) {
      if (['+', '−', '×', '÷', '%', '^'].includes(char)) {
        const next = expression + char;
        setExpression(next);
        setCursorPosition(next.length);
      } else {
        const initial = char === '.' ? '0.' : char;
        setExpression(initial);
        setCursorPosition(initial.length);
      }
      setIsEvaluated(false);
      return;
    }
    const pos = Math.min(Math.max(0, cursorPosition), expression.length);
    const before = expression.slice(0, pos);
    const after = expression.slice(pos);
    // Prevent duplicate consecutive decimals within the same number token
    if (char === '.') {
      const match = before.match(/(\d*(?:\.\d*)?)$/);
      if (match && match[1].includes('.')) {
        return; // Already has a decimal dot
      }
      if (!match || match[1] === '') {
        char = '0.';
      }
    }
    // Prevent duplicate consecutive operators
    const isOperator = ['+', '−', '×', '÷', '^'].includes(char);
    const lastIsOperator = ['+', '−', '×', '÷', '^'].includes(before.slice(-1));
    let newBefore = before;
    if (isOperator && lastIsOperator) {
      if (char === '−' && ['×', '÷', '^'].includes(before.slice(-1))) {
        // Keep negative minus after multiply/divide/power
      } else {
        newBefore = before.slice(0, -1);
      }
    }
    const nextExpr = newBefore + char + after;
    setExpression(nextExpr);
    setCursorPosition(newBefore.length + char.length);
  };
  // Insert y-th root of x (ʸ√x): converts trailing digits to superscript or inserts ³√(
  const insertYRoot = () => {
    setLastOp(null);
    if (isEvaluated) {
      setExpression('³√(');
      setCursorPosition(3);
      setIsEvaluated(false);
      return;
    }
    const pos = Math.min(Math.max(0, cursorPosition), expression.length);
    const before = expression.slice(0, pos);
    const after = expression.slice(pos);
    const match = before.match(/(\d+)$/);
    if (match) {
      const num = match[1];
      const prefix = before.slice(0, before.length - num.length);
      const sup = toSuperscript(num);
      const nextExpr = prefix + sup + '√(' + after;
      setExpression(nextExpr);
      setCursorPosition(prefix.length + sup.length + 2);
    } else {
      const nextExpr = before + '³√(' + after;
      setExpression(nextExpr);
      setCursorPosition(before.length + 3);
    }
  };
  // Smart Parentheses at cursor position
  const handleSmartParentheses = () => {
    setLastOp(null);
    if (isEvaluated) {
      setExpression('(');
      setCursorPosition(1);
      setIsEvaluated(false);
      return;
    }
    const pos = Math.min(Math.max(0, cursorPosition), expression.length);
    const before = expression.slice(0, pos);
    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;
    const lastChar = before.slice(-1);
    if (/[\d%)]/.test(lastChar) && openCount > closeCount) {
      insertAtCursor(')');
    } else {
      insertAtCursor('(');
    }
  };
  // Backspace at cursor position
  const handleBackspace = () => {
    setLastOp(null);
    if (isEvaluated) {
      setExpression('');
      setCursorPosition(0);
      setIsEvaluated(false);
      return;
    }
    if (cursorPosition === 0 || !expression) return;
    const pos = Math.min(Math.max(0, cursorPosition), expression.length);
    const before = expression.slice(0, pos);
    const after = expression.slice(pos);
    // Check if deleting a multi-char scientific function before cursor
    for (const fn of [
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
      '³√(',
      '²√(',
      '⁴√(',
      '⁵√(',
      '√(',
    ]) {
      if (before.endsWith(fn)) {
        const newBefore = before.slice(0, -fn.length);
        setExpression(newBefore + after);
        setCursorPosition(newBefore.length);
        return;
      }
    }
    const newBefore = before.slice(0, -1);
    setExpression(newBefore + after);
    setCursorPosition(newBefore.length);
  };
  // Insert scientific exponent (EE)
  const insertEE = () => {
    setLastOp(null);
    if (isEvaluated) {
      setExpression('1e');
      setCursorPosition(2);
      setIsEvaluated(false);
      return;
    }
    const pos = Math.min(Math.max(0, cursorPosition), expression.length);
    const before = expression.slice(0, pos);
    const after = expression.slice(pos);
    const lastChar = before.slice(-1);
    if (/\d|\./.test(lastChar)) {
      const nextExpr = before + 'e' + after;
      setExpression(nextExpr);
      setCursorPosition(before.length + 1);
    } else {
      const nextExpr = before + '1e' + after;
      setExpression(nextExpr);
      setCursorPosition(before.length + 2);
    }
  };
  // Clear all
  const handleClear = () => {
    setExpression('');
    setCursorPosition(0);
    setIsEvaluated(false);
    setLastOp(null);
  };
  // Move cursor left / right
  const moveCursor = (dir: 'left' | 'right') => {
    if (isEvaluated) {
      setIsEvaluated(false);
    }
    if (dir === 'left') {
      setCursorPosition((prev) => Math.max(0, prev - 1));
    } else {
      setCursorPosition((prev) => Math.min(expression.length, prev + 1));
    }
  };
  // Toggle sign of active number at cursor
  const handleToggleSign = () => {
    setLastOp(null);
    if (!expression) return;
    if (isEvaluated) {
      const val = parseFloat(expression);
      if (!isNaN(val)) {
        const toggled = String(-val);
        setExpression(toggled);
        setCursorPosition(toggled.length);
      }
      return;
    }
    const pos = Math.min(Math.max(0, cursorPosition), expression.length);
    const before = expression.slice(0, pos);
    const after = expression.slice(pos);
    const match = before.match(/([+\-×÷(]?)(-?\d+(?:\.\d+)?)$/);
    if (!match) return;
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
    setExpression(replaced + after);
    setCursorPosition(replaced.length);
  };
  // Memory Operations
  const handleMemoryAdd = () => {
    const activeVal =
      liveResult || (expression && !/[+\-×÷^]$/.test(expression) ? expression : '0');
    const num = parseFloat(activeVal);
    if (!isNaN(num)) {
      setMemory((prev) => prev + num);
    }
  };
  const handleMemorySubtract = () => {
    const activeVal =
      liveResult || (expression && !/[+\-×÷^]$/.test(expression) ? expression : '0');
    const num = parseFloat(activeVal);
    if (!isNaN(num)) {
      setMemory((prev) => prev - num);
    }
  };
  const handleMemoryRecall = () => {
    if (memory !== 0) {
      insertAtCursor(String(memory));
    }
  };
  const handleMemoryClear = () => {
    setMemory(0);
  };
  // Evaluate & Commit (Supports repeating last operation if = is pressed repeatedly)
  const handleCalculate = () => {
    if (!expression) return;
    // Repeating last operation (e.g. 5 + 3 = 8, press = again -> 8 + 3 = 11, press = -> 14)
    if (isEvaluated && lastOp) {
      const repeatExpr = `${expression}${lastOp.op}${lastOp.operand}`;
      const { result, error } = evaluateExpression(repeatExpr, isDeg);
      if (result !== null && !error) {
        setHistory((prev) => [
          {
            expression: repeatExpr,
            result,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 49),
        ]);
        setExpression(result);
        setCursorPosition(result.length);
        setIsEvaluated(true);
      }
      return;
    }
    // Normal calculation
    const extracted = extractLastOperation(expression);
    const { result, error } = evaluateExpression(expression, isDeg);
    if (result !== null && !error) {
      setLastOp(extracted);
      setHistory((prev) => [
        {
          expression,
          result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 49),
      ]);
      setExpression(result);
      setCursorPosition(result.length);
      setIsEvaluated(true);
    }
  };
  const handlersRef = useRef({
    handleCopy,
    handlePaste,
    insertAtCursor,
    handleCalculate,
    handleBackspace,
    handleClear,
    moveCursor,
    isEvaluated,
    expression,
    liveResult,
  });
  useEffect(() => {
    handlersRef.current = {
      handleCopy,
      handlePaste,
      insertAtCursor,
      handleCalculate,
      handleBackspace,
      handleClear,
      moveCursor,
      isEvaluated,
      expression,
      liveResult,
    };
  });
  // Keyboard Event Listeners for Typing, Copy & Paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      // Copy: Cmd+C / Ctrl+C
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        handlersRef.current.handleCopy();
        return;
      }
      // Paste: Cmd+V / Ctrl+V handled by paste listener
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlersRef.current.insertAtCursor(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('.');
      } else if (e.key === '+') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('−');
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('%');
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        handlersRef.current.insertAtCursor(e.key);
      } else if (e.key === '^') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('^');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handlersRef.current.handleCalculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlersRef.current.handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlersRef.current.moveCursor('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlersRef.current.moveCursor('right');
      }
    };
    const handleWindowPaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      e.preventDefault();
      const pastedData = e.clipboardData?.getData('text');
      if (pastedData) {
        handlersRef.current.handlePaste(pastedData);
      }
    };
    const handleWindowCopy = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (!window.getSelection()?.toString()) {
        const { isEvaluated: evaluated, expression: expr, liveResult: live } = handlersRef.current;
        const textToCopy = evaluated ? expr : live || expr;
        if (textToCopy) {
          e.preventDefault();
          e.clipboardData?.setData('text/plain', textToCopy);
          setToastMessage('Copied');
          setTimeout(() => setToastMessage(null), 2000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handleWindowPaste);
    window.addEventListener('copy', handleWindowCopy);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handleWindowPaste);
      window.removeEventListener('copy', handleWindowCopy);
    };
  }, []);
  const safeCursor = Math.min(Math.max(0, cursorPosition), expression.length);
  const textBeforeCursor = expression.slice(0, safeCursor);
  const textAfterCursor = expression.slice(safeCursor);
  // Render individual characters with elevated superscript styling for root indices
  const renderChar = (ch: string, key: string, onClick: (e: React.MouseEvent) => void) => {
    const isSup = /[⁰¹²³⁴⁵⁶⁷⁸⁹ʸˣ]/.test(ch);
    return (
      <span
        key={key}
        onClick={onClick}
        className={`hover:bg-primary/20 rounded cursor-pointer transition-colors inline-block ${
          isSup ? 'text-[0.62em] -translate-y-[0.45em] font-medium leading-none' : ''
        }`}
      >
        {ch}
      </span>
    );
  };
  return (
    <main className="w-full max-w-sm sm:max-w-md mx-auto px-3 py-2 sm:py-4 flex flex-col min-h-[calc(100dvh-56px)] justify-between select-none relative">
      <SEOHead
        title="Online Calculator — Free Scientific & Basic Calculator India 2026"
        description="Fast, institutional-grade online calculator with editable cursor display, implicit multiplication, copy/paste support, memory operations (M+, M-, MC, MR), percentages, y-th root of x (³√(27)), and trigonometry."
        keywords="online calculator, scientific calculator, basic calculator, percentage calculator, cube root calculator, math calculator, memory operations calculator, fast calculator"
        canonicalPath="/calculator"
        noIndex={false}
      />
      {/* Floating Toast Notification for Copy/Paste */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="badge badge-neutral shadow-xl px-3 py-2 text-xs font-semibold gap-1.5 border border-base-300/50 backdrop-blur-md">
            <FiCheck className="h-3.5 w-3.5 text-success" /> {toastMessage}
          </div>
        </div>
      )}
      {/* Top Display Area with Moveable Cursor & Memory Indicator */}
      <div className="flex-1 flex flex-col justify-end pb-2 sm:pb-3">
        {/* History Modal / Drawer */}
        {showHistory && (
          <div className="relative mb-3 bg-base-200/95 border border-base-300 rounded-2xl p-3 shadow-xl max-h-56 overflow-y-auto backdrop-blur-md animate-fadeIn">
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
                      setCursorPosition(item.result.length);
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
        {/* Memory Indicator */}
        {memory !== 0 && (
          <div className="flex items-center justify-end px-2 mb-1 gap-1">
            <span
              onClick={handleMemoryRecall}
              className="badge badge-primary badge-sm font-mono font-bold cursor-pointer hover:opacity-80 transition-opacity"
              title="Click to recall memory (MR)"
            >
              M = {memory}
            </span>
          </div>
        )}
        {/* Expression Display with Interactive Click-to-Position Cursor */}
        <div
          ref={displayContainerRef}
          className="w-full overflow-x-auto whitespace-nowrap text-right py-2 px-2 scrollbar-none rounded-xl cursor-text transition-all bg-base-200/30 hover:bg-base-200/50 select-text"
          onClick={(e) => {
            if (e.target === e.currentTarget && expression.length > 0) {
              setCursorPosition(expression.length);
            }
          }}
        >
          <style>{`
            @keyframes calcCaretBlink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
          <div className="inline-flex items-center justify-end text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-base-content font-sans min-h-[3rem]">
            {expression.length === 0 ? (
              <span className="opacity-30">0</span>
            ) : (
              <>
                {/* Clickable characters before cursor */}
                {textBeforeCursor.split('').map((ch, idx) =>
                  renderChar(ch, `before-${idx}`, (e) => {
                    e.stopPropagation();
                    setCursorPosition(idx);
                    setIsEvaluated(false);
                  })
                )}
                {/* Visible Blinking Cursor (only when content exists) */}
                <span
                  className="w-[2.5px] sm:w-[3px] h-[1.1em] bg-primary inline-block align-middle rounded-full mx-[1px]"
                  style={{
                    animation: 'calcCaretBlink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                {/* Clickable characters after cursor */}
                {textAfterCursor.split('').map((ch, idx) =>
                  renderChar(ch, `after-${idx}`, (e) => {
                    e.stopPropagation();
                    setCursorPosition(textBeforeCursor.length + idx + 1);
                    setIsEvaluated(false);
                  })
                )}
              </>
            )}
          </div>
        </div>
        {/* Live Calculation Preview */}
        <div
          onClick={handleCopy}
          className="h-8 flex items-center justify-end px-2 cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to copy result"
        >
          {liveResult !== null && !isEvaluated ? (
            <span className="text-xl sm:text-2xl font-light text-base-content/50 font-sans tracking-tight">
              {liveResult}
            </span>
          ) : (
            <span className="text-sm opacity-0">0</span>
          )}
        </div>
        {/* Utility Icon Bar: History, Scientific, Copy, Paste, Cursor Chevrons & Backspace */}
        <div className="flex items-center justify-between border-b border-base-300/60 pt-2 pb-2 px-1 text-base-content/70">
          <div className="flex items-center gap-1 sm:gap-1.5">
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
              className={`btn btn-sm px-2.5 gap-1.5 text-xs font-semibold ${showScientific ? 'btn-primary shadow-xs' : 'btn-ghost text-base-content/70'}`}
              title="Toggle Scientific Keypad (Trig, Hyperbolic, Roots, Exponents)"
            >
              <TbMathFunction className="h-4 w-4" />
              <span>Scientific</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!expression && !liveResult}
              className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-primary disabled:opacity-30"
              title="Copy expression or result (Ctrl+C / ⌘C)"
            >
              <FiCopy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePaste()}
              className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-primary"
              title="Paste expression (Ctrl+V / ⌘V)"
            >
              <FiClipboard className="h-4 w-4" />
            </button>
          </div>
          {/* Cursor Stepper & Backspace */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => moveCursor('left')}
              className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-primary hover:bg-base-200"
              title="Move cursor left"
              disabled={cursorPosition === 0}
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => moveCursor('right')}
              className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-primary hover:bg-base-200"
              title="Move cursor right"
              disabled={cursorPosition >= expression.length}
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="btn btn-ghost btn-sm btn-circle text-primary hover:bg-primary/10 ml-1"
              title="Backspace"
            >
              <FiDelete className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {/* Scientific & Memory Tools Panel (Expandable) */}
      {showScientific && (
        <div className="mb-2 p-2 bg-base-200/50 rounded-2xl border border-base-300/80 space-y-1.5 animate-fadeIn">
          {/* Top Row: DEG/RAD toggle + Memory Row (MC, MR, M+, M-) */}
          <div className="flex items-center justify-between px-1 gap-1">
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
            {/* Memory Toolbar: MC, MR, M+, M- */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleMemoryClear}
                disabled={memory === 0}
                className="btn btn-ghost btn-xs text-[11px] font-bold px-2 text-error disabled:opacity-40"
                title="Memory Clear (MC)"
              >
                MC
              </button>
              <button
                type="button"
                onClick={handleMemoryRecall}
                disabled={memory === 0}
                className="btn btn-ghost btn-xs text-[11px] font-bold px-2 text-primary disabled:opacity-40"
                title="Memory Recall (MR)"
              >
                MR
              </button>
              <button
                type="button"
                onClick={handleMemoryAdd}
                className="btn btn-ghost btn-xs text-[11px] font-bold px-2 text-primary hover:bg-primary/10"
                title="Memory Add (M+)"
              >
                M+
              </button>
              <button
                type="button"
                onClick={handleMemorySubtract}
                className="btn btn-ghost btn-xs text-[11px] font-bold px-2 text-primary hover:bg-primary/10"
                title="Memory Subtract (M-)"
              >
                M-
              </button>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-xs font-semibold">
            {[
              { label: 'sin', fn: () => insertAtCursor('sin(') },
              { label: 'cos', fn: () => insertAtCursor('cos(') },
              { label: 'tan', fn: () => insertAtCursor('tan(') },
              { label: 'ln', fn: () => insertAtCursor('ln(') },
              { label: 'log', fn: () => insertAtCursor('log(') },
              { label: 'sinh', fn: () => insertAtCursor('sinh(') },
              { label: 'cosh', fn: () => insertAtCursor('cosh(') },
              { label: 'tanh', fn: () => insertAtCursor('tanh(') },
              { label: 'e', fn: () => insertAtCursor('e') },
              { label: 'EE', fn: insertEE },
              { label: 'sin⁻¹', fn: () => insertAtCursor('asin(') },
              { label: 'cos⁻¹', fn: () => insertAtCursor('acos(') },
              { label: 'tan⁻¹', fn: () => insertAtCursor('atan(') },
              { label: '√', fn: () => insertAtCursor('√(') },
              { label: 'ʸ√x', fn: insertYRoot },
              { label: 'xʸ', fn: () => insertAtCursor('^') },
              { label: '1/x', fn: () => insertAtCursor('1/(') },
              { label: 'π', fn: () => insertAtCursor('π') },
              { label: '|x|', fn: () => insertAtCursor('abs(') },
              { label: 'x!', fn: () => insertAtCursor('!') },
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
      {/* Main Keypad Grid (Circular/Pill Keypad) */}
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
          onClick={() => insertAtCursor('%')}
          className="btn h-14 sm:h-16 rounded-full text-lg sm:text-xl font-bold bg-base-200 text-primary hover:bg-primary/15 border-0 shadow-none"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('÷')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary/15 text-primary hover:bg-primary/25 border-0 shadow-none"
        >
          ÷
        </button>
        {/* Row 2: 7, 8, 9, × */}
        {['7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => insertAtCursor(num)}
            className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => insertAtCursor('×')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary/15 text-primary hover:bg-primary/25 border-0 shadow-none"
        >
          ×
        </button>
        {/* Row 3: 4, 5, 6, − */}
        {['4', '5', '6'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => insertAtCursor(num)}
            className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => insertAtCursor('−')}
          className="btn h-14 sm:h-16 rounded-full text-2xl font-bold bg-primary/15 text-primary hover:bg-primary/25 border-0 shadow-none"
        >
          −
        </button>
        {/* Row 4: 1, 2, 3, + */}
        {['1', '2', '3'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => insertAtCursor(num)}
            className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => insertAtCursor('+')}
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
          onClick={() => insertAtCursor('0')}
          className="btn h-14 sm:h-16 rounded-full text-xl sm:text-2xl font-normal bg-base-200 hover:bg-base-300 text-base-content border-0 shadow-none"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('.')}
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
