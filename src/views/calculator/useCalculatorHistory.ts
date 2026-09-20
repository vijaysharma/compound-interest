import { useState, useEffect } from 'react';
import { HistoryItem } from './types';
export const useCalculatorHistory = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved =
        localStorage.getItem('calc_history') || localStorage.getItem('android_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('calc_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);
  const addHistoryItem = (expression: string, result: string) => {
    setHistory((prev) => [
      {
        expression,
        result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 49),
    ]);
  };
  const clearHistory = () => {
    setHistory([]);
  };
  return {
    showHistory,
    setShowHistory,
    history,
    addHistoryItem,
    clearHistory,
  };
};
