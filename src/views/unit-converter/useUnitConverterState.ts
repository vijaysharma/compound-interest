import { useState, useEffect, useRef, useMemo } from 'react';
import {
  unitTypes,
  UnitCategory,
  SavedState,
  DEFAULT_STATE,
  STORAGE_KEY,
  VALID_CATEGORIES,
  convertValue,
  fmt,
} from './unitData';
const getSavedState = (): SavedState => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const cat: UnitCategory = VALID_CATEGORIES.has(parsed.category)
          ? parsed.category
          : 'Length';
        const validUnits = cat === 'Temperature' ? ['C', 'F', 'K'] : Object.keys(unitTypes[cat]);
        const fUnit = validUnits.includes(parsed.fromUnit) ? parsed.fromUnit : validUnits[0] || 'm';
        const tUnit = validUnits.includes(parsed.toUnit) ? parsed.toUnit : validUnits[1] || 'ft';
        const rawInput =
          typeof parsed.inputValue === 'string' ? parsed.inputValue.slice(0, 20) : '1';
        return { category: cat, fromUnit: fUnit, toUnit: tUnit, inputValue: rawInput };
      }
    }
  } catch (err) {
    console.warn('Failed to load unit converter state:', err);
  }
  return DEFAULT_STATE;
};
export function useUnitConverterState() {
  const [category, setCategory] = useState<UnitCategory>(DEFAULT_STATE.category);
  const [fromUnit, setFromUnit] = useState<string>(DEFAULT_STATE.fromUnit);
  const [toUnit, setToUnit] = useState<string>(DEFAULT_STATE.toUnit);
  const [inputValue, setInputValue] = useState<string>(DEFAULT_STATE.inputValue);
  const isLoadedRef = useRef(false);
  useEffect(() => {
    const handleRestore = () => {
      try {
        const saved = getSavedState();
        setCategory(saved.category);
        setFromUnit(saved.fromUnit);
        setToUnit(saved.toUnit);
        setInputValue(saved.inputValue);
      } catch (err) {
        console.warn('Failed to restore unit converter state:', err);
      } finally {
        isLoadedRef.current = true;
      }
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ category, fromUnit, toUnit, inputValue })
      );
    } catch (err) {
      console.warn('Failed to persist unit converter state:', err);
    }
  }, [category, fromUnit, toUnit, inputValue]);
  const handleCategoryChange = (c: UnitCategory) => {
    setCategory(c);
    if (c === 'Temperature') {
      setFromUnit('C');
      setToUnit('F');
    } else {
      const units = Object.keys(unitTypes[c]);
      setFromUnit(units[2] || units[0]);
      setToUnit(units[5] || units[1]);
    }
  };
  const numVal = parseFloat(inputValue);
  const hasValue = Number.isFinite(numVal) && !isNaN(numVal);
  const allUnits = useMemo(() => {
    if (category === 'Temperature') return ['C', 'F', 'K'];
    return Object.keys(unitTypes[category]);
  }, [category]);
  const primaryResult = hasValue ? convertValue(numVal, fromUnit, toUnit, category) : null;
  const outputValue = primaryResult !== null ? fmt(primaryResult) : '';
  const unitRatioResult = convertValue(1, fromUnit, toUnit, category);
  const unitRatio = unitRatioResult !== null ? fmt(unitRatioResult) : null;
  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(outputValue.replace(/,/g, ''));
  };
  const equivalents = useMemo(() => {
    return allUnits.map((u) => {
      if (!hasValue) return { unit: u, display: '—' };
      const r = convertValue(numVal, fromUnit, u, category);
      return { unit: u, display: r !== null ? fmt(r) : '—' };
    });
  }, [allUnits, hasValue, numVal, fromUnit, category]);
  return {
    category,
    fromUnit,
    setFromUnit,
    toUnit,
    setToUnit,
    inputValue,
    setInputValue,
    outputValue,
    hasValue,
    allUnits,
    unitRatio,
    equivalents,
    handleCategoryChange,
    handleSwap,
  };
}
