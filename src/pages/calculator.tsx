import React, { useState, useCallback } from 'react';
import SEOHead from '../components/SEOHead.tsx';
import JoinedButtonGroup from '../components/JoinedButtonGroup.tsx';

type CalcMode = 'basic' | 'scientific';

const MODE_DATA = [
  { id: 'basic', value: 'basic', title: 'Basic' },
  { id: 'scientific', value: 'scientific', title: 'Scientific' },
];

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [mode, setMode] = useState<CalcMode>('basic');
  const [memory, setMemory] = useState(0);
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [isDeg, setIsDeg] = useState(true);

  const appendDigit = (digit: string) => {
    if (isNewNumber) {
      setDisplay(digit === '.' ? '0.' : digit);
      setIsNewNumber(false);
    } else {
      if (digit === '.' && display.includes('.')) return;
      setDisplay(display + digit);
    }
  };

  const appendOperator = (op: string) => {
    setExpression((prev) => {
      const trimmed = prev.trimEnd();
      // Replace trailing operator with new one
      if (trimmed && ['+', '-', '×', '÷', '**'].some((o) => trimmed.endsWith(o))) {
        return trimmed.slice(0, -op.length).trimEnd() + ' ' + op + ' ';
      }
      return trimmed + ' ' + display + ' ' + op;
    });
    setIsNewNumber(true);
  };

  const toRadians = (val: number) => (isDeg ? (val * Math.PI) / 180 : val);
  const fromRadians = (val: number) => (isDeg ? (val * 180) / Math.PI : val);

  const applyScientificFn = useCallback(
    (fn: string) => {
      const val = parseFloat(display);
      if (isNaN(val)) return;
      let result: number;
      switch (fn) {
        case 'sin':
          result = Math.sin(toRadians(val));
          break;
        case 'cos':
          result = Math.cos(toRadians(val));
          break;
        case 'tan':
          result = Math.tan(toRadians(val));
          break;
        case 'asin':
          result = fromRadians(Math.asin(val));
          break;
        case 'acos':
          result = fromRadians(Math.acos(val));
          break;
        case 'atan':
          result = fromRadians(Math.atan(val));
          break;
        case 'ln':
          result = Math.log(val);
          break;
        case 'log':
          result = Math.log10(val);
          break;
        case '√':
          result = Math.sqrt(val);
          break;
        case 'x²':
          result = val * val;
          break;
        case 'x³':
          result = val * val * val;
          break;
        case '1/x':
          result = val !== 0 ? 1 / val : NaN;
          break;
        case 'x!': {
          if (val < 0 || val !== Math.floor(val) || val > 170) {
            result = NaN;
          } else {
            let f = 1;
            for (let i = 2; i <= val; i++) f *= i;
            result = f;
          }
          break;
        }
        case '|x|':
          result = Math.abs(val);
          break;
        case 'e^x':
          result = Math.exp(val);
          break;
        case '10^x':
          result = Math.pow(10, val);
          break;
        default:
          return;
      }
      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
      } else {
        setDisplay(String(parseFloat(result.toPrecision(12))));
      }
      setIsNewNumber(true);
    },
    [display, isDeg]
  );

  const calculate = () => {
    try {
      const fullExpr = expression + ' ' + display;
      const sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\s+/g, ' ')
        .trim();

      if (!sanitized) return;

      // Safe evaluation using Function constructor (no eval)
      const result = new Function('return ' + sanitized)() as number;

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
      } else {
        setDisplay(String(parseFloat(result.toPrecision(12))));
      }
      setExpression('');
      setIsNewNumber(true);
    } catch {
      setDisplay('Error');
      setExpression('');
      setIsNewNumber(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
    setIsNewNumber(true);
  };

  const clearEntry = () => {
    setDisplay('0');
    setIsNewNumber(true);
  };

  const toggleSign = () => {
    if (display !== '0' && display !== 'Error') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    }
  };

  const percentage = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay(String(val / 100));
      setIsNewNumber(true);
    }
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  const btnBase =
    'btn border-0 text-base font-semibold h-12 min-h-0 flex-1 shadow-none';
  const btnNum = `${btnBase} bg-base-200 hover:bg-base-300 text-base-content`;
  const btnOp = `${btnBase} bg-primary/15 hover:bg-primary/25 text-primary font-bold`;
  const btnAction = `${btnBase} bg-base-300 hover:bg-base-content/20 text-base-content/80`;
  const btnEqual = `${btnBase} bg-primary hover:bg-primary/90 text-primary-content font-bold`;
  const btnSci = `${btnBase} bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-medium`;

  return (
    <main className="w-full max-w-md mx-auto px-2 py-4 space-y-4">
      <SEOHead
        title="Calculator — Free Online Basic & Scientific Calculator"
        description="Free online calculator with basic and scientific modes. Compute trigonometry, logarithms, factorials, powers, and everyday arithmetic. 100% private."
        keywords="calculator, online calculator, scientific calculator, basic calculator, free calculator, math calculator"
        canonicalPath="/calculator"
        noIndex={false}
      />

      <header className="text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Calculator</h1>
      </header>

      <JoinedButtonGroup
        data={MODE_DATA}
        selectedValue={mode}
        updateSelectedValue={(v: string) => setMode(v as CalcMode)}
        sizePrefix="sm"
      />

      {/* Display */}
      <div className="card bg-base-200 border border-base-300 rounded-xl px-4 py-3">
        <p className="text-xs text-base-content/50 min-h-[1rem] text-right font-mono truncate">
          {expression || '\u00A0'}
        </p>
        <p className="text-3xl sm:text-4xl font-bold text-right font-mono truncate mt-1">
          {display}
        </p>
      </div>

      {/* Scientific Functions */}
      {mode === 'scientific' && (
        <div className="space-y-1">
          <div className="flex gap-1 justify-end">
            <button
              className={`btn btn-xs ${isDeg ? 'btn-primary' : 'btn-outline btn-primary'}`}
              onClick={() => setIsDeg(true)}
            >
              DEG
            </button>
            <button
              className={`btn btn-xs ${!isDeg ? 'btn-primary' : 'btn-outline btn-primary'}`}
              onClick={() => setIsDeg(false)}
            >
              RAD
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {['sin', 'cos', 'tan', 'ln', 'log'].map((fn) => (
              <button key={fn} className={btnSci} onClick={() => applyScientificFn(fn)}>
                {fn}
              </button>
            ))}
            {['asin', 'acos', 'atan', '√', 'x²'].map((fn) => (
              <button key={fn} className={btnSci} onClick={() => applyScientificFn(fn)}>
                {fn}
              </button>
            ))}
            {['x³', 'x!', '|x|', 'e^x', '10^x'].map((fn) => (
              <button key={fn} className={btnSci} onClick={() => applyScientificFn(fn)}>
                {fn}
              </button>
            ))}
            <button className={btnSci} onClick={() => appendDigit(String(Math.PI))}>
              π
            </button>
            <button className={btnSci} onClick={() => appendDigit(String(Math.E))}>
              e
            </button>
            <button className={btnSci} onClick={() => appendOperator('**')}>
              xʸ
            </button>
            <button
              className={btnSci}
              onClick={() => {
                setMemory(memory + parseFloat(display));
                setIsNewNumber(true);
              }}
            >
              M+
            </button>
            <button
              className={btnSci}
              onClick={() => {
                setDisplay(String(memory));
                setIsNewNumber(true);
              }}
            >
              MR
            </button>
          </div>
        </div>
      )}

      {/* Basic Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <button className={btnAction} onClick={clear}>
          AC
        </button>
        <button className={btnAction} onClick={clearEntry}>
          CE
        </button>
        <button className={btnAction} onClick={backspace}>
          ⌫
        </button>
        <button className={btnOp} onClick={() => appendOperator('÷')}>
          ÷
        </button>

        {['7', '8', '9'].map((d) => (
          <button key={d} className={btnNum} onClick={() => appendDigit(d)}>
            {d}
          </button>
        ))}
        <button className={btnOp} onClick={() => appendOperator('×')}>
          ×
        </button>

        {['4', '5', '6'].map((d) => (
          <button key={d} className={btnNum} onClick={() => appendDigit(d)}>
            {d}
          </button>
        ))}
        <button className={btnOp} onClick={() => appendOperator('-')}>
          −
        </button>

        {['1', '2', '3'].map((d) => (
          <button key={d} className={btnNum} onClick={() => appendDigit(d)}>
            {d}
          </button>
        ))}
        <button className={btnOp} onClick={() => appendOperator('+')}>
          +
        </button>

        <button className={btnAction} onClick={toggleSign}>
          ±
        </button>
        <button className={btnNum} onClick={() => appendDigit('0')}>
          0
        </button>
        <button className={btnNum} onClick={() => appendDigit('.')}>
          .
        </button>
        <button className={btnEqual} onClick={calculate}>
          =
        </button>

        <button className={`${btnAction} col-span-2`} onClick={percentage}>
          %
        </button>
        <button className={`${btnAction} col-span-2`} onClick={() => applyScientificFn('1/x')}>
          1/x
        </button>
      </div>
    </main>
  );
};

export default Calculator;
