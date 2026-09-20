import { useEffect, useRef } from 'react';
interface CalculatorKeyboardHandlers {
  handleCopy: () => void;
  handlePaste: (pastedText?: string) => void;
  insertAtCursor: (char: string) => void;
  insertEE: () => void;
  handleCalculate: () => void;
  handleBackspace: () => void;
  handleClear: () => void;
  moveCursor: (dir: 'left' | 'right') => void;
  isEvaluated: boolean;
  expression: string;
  liveResult: string | null;
  setToastMessage: (msg: string | null) => void;
}
export const useCalculatorKeyboard = (handlers: CalculatorKeyboardHandlers) => {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        handlersRef.current.handleCopy();
        return;
      }
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
      } else if (e.key === 'e') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('e');
      } else if (e.key === 'E') {
        e.preventDefault();
        handlersRef.current.insertEE();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('π');
      } else if (e.key === '!') {
        e.preventDefault();
        handlersRef.current.insertAtCursor('!');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlersRef.current.moveCursor('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlersRef.current.moveCursor('right');
      }
    };
    const handleWindowPaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      e.preventDefault();
      const pastedData = e.clipboardData?.getData('text');
      if (pastedData) {
        handlersRef.current.handlePaste(pastedData);
      }
    };
    const handleWindowCopy = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (!window.getSelection()?.toString()) {
        const { isEvaluated: evaluated, expression: expr, liveResult: live, setToastMessage } = handlersRef.current;
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
};
