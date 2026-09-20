import { useState, useEffect } from 'react';
import { isErrorState } from './types';
export const useCalculatorMemory = (
  expression: string,
  liveResult: string | null,
  insertAtCursor: (char: string) => void
) => {
  const [memory, setMemory] = useState<number>(() => {
    try {
      const saved =
        localStorage.getItem('calc_memory') || localStorage.getItem('android_calc_memory');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('calc_memory', String(memory));
    } catch (e) {
      console.error(e);
    }
  }, [memory]);
  const handleMemoryAdd = () => {
    if (isErrorState(expression)) return;
    const activeVal =
      liveResult || (expression && !/[+\-×÷^]$/.test(expression) ? expression : '0');
    const num = parseFloat(activeVal);
    if (!isNaN(num)) {
      setMemory((prev) => prev + num);
    }
  };
  const handleMemorySubtract = () => {
    if (isErrorState(expression)) return;
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
  return {
    memory,
    handleMemoryAdd,
    handleMemorySubtract,
    handleMemoryRecall,
    handleMemoryClear,
  };
};
