'use client';
import React, { useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead';
import { FiNavigation, FiRepeat } from 'react-icons/fi';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import styles from './UnitConverter.module.scss';
const unitTypes = {
  Length: {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
  },
  Area: {
    'sq m': 1,
    'sq km': 1000000,
    'sq ft': 0.09290304,
    'sq yd': 0.83612736,
    acre: 4046.8564224,
    hectare: 10000,
    cent: 40.468564224,
    'kottah (WB)': 66.8901888,
    'katha (Bihar)': 126.4642632,
    'katha (Assam)': 267.5607552,
    'katha (UP)': 126.3481344,
    guntha: 101.17141056,
    'ground (TN)': 222.967296,
    'bigha (WB)': 1337.803776,
  },
  Weight: {
    mg: 0.000001,
    g: 0.001,
    kg: 1,
    ton: 1000,
    oz: 0.0283495,
    lb: 0.453592,
  },
  Volume: {
    ml: 0.001,
    l: 1,
    'US gal': 3.78541,
    'US qt': 0.946353,
    'US pt': 0.473176,
    'US cup': 0.24,
    'US fl oz': 0.0295735,
    barrel: 158.9873,
  },
  Speed: {
    'm/s': 1,
    'km/h': 0.277778,
    mph: 0.44704,
    knot: 0.514444,
  },
  Data: {
    B: 1,
    KB: 1024,
    MB: 1048576,
    GB: 1073741824,
    TB: 1099511627776,
    PB: 1125899906842624,
  },
};
type UnitCategory = keyof typeof unitTypes | 'Temperature';
interface UnitInputRowProps {
  label?: string;
  value: string;
  onChange?: (val: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  availableUnits: string[];
  readOnly?: boolean;
  isResult?: boolean;
  className?: string;
}
const UnitInputRow: React.FC<UnitInputRowProps> = ({
  label,
  value,
  onChange,
  unit,
  onUnitChange,
  availableUnits,
  readOnly = false,
  isResult = false,
  className,
}) => (
  <div className={`${styles.rowJoin} ${className ?? ''}`}>
    {label && (
      <span className={styles.rowLabel}>
        {label}
      </span>
    )}
    <input
      type={readOnly ? 'text' : 'number'}
      className={`${styles.rowInput} ${isResult ? styles.resultInput : ''}`}
      maxLength={20}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value.slice(0, 20)) : undefined}
      placeholder={readOnly ? '0' : 'Enter value'}
      readOnly={readOnly}
    />
    <select
      className={styles.rowSelect}
      value={unit}
      onChange={(e) => onUnitChange(e.target.value)}
    >
      {availableUnits.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  </div>
);
const STORAGE_KEY = 'unit_converter_state';
interface SavedState {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  inputValue: string;
}
const VALID_CATEGORIES: Set<string> = new Set([
  'Length', 'Weight', 'Temperature', 'Area', 'Volume', 'Speed', 'Data',
]);
const getSavedState = (): SavedState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const cat: UnitCategory = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Length';
        const validUnits = cat === 'Temperature' ? ['C', 'F', 'K'] : Object.keys(unitTypes[cat]);
        const fUnit = validUnits.includes(parsed.fromUnit) ? parsed.fromUnit : validUnits[0] || 'm';
        const tUnit = validUnits.includes(parsed.toUnit) ? parsed.toUnit : validUnits[1] || 'ft';
        const rawInput = typeof parsed.inputValue === 'string' ? parsed.inputValue.slice(0, 20) : '1';
        return { category: cat, fromUnit: fUnit, toUnit: tUnit, inputValue: rawInput };
      }
    }
  } catch (err) {
    console.warn('Failed to load unit converter state:', err);
  }
  return { category: 'Length', fromUnit: 'm', toUnit: 'ft', inputValue: '1' };
};
/** Convert a value in `from` to `to` within the same category. Returns null on failure. */
const convertValue = (
  val: number,
  from: string,
  to: string,
  category: UnitCategory,
): number | null => {
  if (category === 'Temperature') {
    let c = 0;
    if (from === 'C') c = val;
    else if (from === 'F') c = ((val - 32) * 5) / 9;
    else if (from === 'K') c = val - 273.15;
    if (to === 'C') return c;
    if (to === 'F') return (c * 9) / 5 + 32;
    if (to === 'K') return c + 273.15;
    return null;
  }
  const catData = unitTypes[category];
  const fromFactor = catData?.[from as keyof typeof catData];
  const toFactor = catData?.[to as keyof typeof catData];
  if (!fromFactor || !toFactor) return null;
  return (val * fromFactor) / toFactor;
};
const fmt = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 6 });
const UnitConverter: React.FC = () => {
  const [saved] = useState<SavedState>(getSavedState);
  const [category, setCategory] = useState<UnitCategory>(saved.category);
  const [fromUnit, setFromUnit] = useState<string>(saved.fromUnit);
  const [toUnit, setToUnit] = useState<string>(saved.toUnit);
  const [inputValue, setInputValue] = useState<string>(saved.inputValue);
  // Persist state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ category, fromUnit, toUnit, inputValue }));
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
  const getAvailableUnits = (): string[] => {
    if (category === 'Temperature') return ['C', 'F', 'K'];
    return Object.keys(unitTypes[category]);
  };
  const allUnits = getAvailableUnits();
  // Primary result
  const primaryResult = hasValue ? convertValue(numVal, fromUnit, toUnit, category) : null;
  const outputValue = primaryResult !== null ? fmt(primaryResult) : '';
  // Unit ratio badge: how many toUnits is 1 fromUnit
  const unitRatioResult = convertValue(1, fromUnit, toUnit, category);
  const unitRatio = unitRatioResult !== null ? fmt(unitRatioResult) : null;
  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(outputValue.replace(/,/g, ''));
  };
  // All-category equivalents
  const equivalents = allUnits.map((u) => {
    if (!hasValue) return { unit: u, display: '—' };
    const r = convertValue(numVal, fromUnit, u, category);
    return { unit: u, display: r !== null ? fmt(r) : '—' };
  });
  return (
    <main className={styles.container}>
      <SEOHead
        title="Unit Converter — Length, Area, Weight, Temp | Rupee Calculator"
        description="Free online unit converter tool. Convert land area (Cent, Kottah, Katha, Acre, Guntha), length, weight, volume, temperature, and speed instantly."
        canonicalPath="/utilities/unit-converter"
      />
      <>
        <h2 className={styles.title}>
          <FiNavigation className={styles.titleIcon} /> Unit Converter
        </h2>
        <p className={styles.subtitle}>
          Convert between different units of measurement for length, area, weight, volume,
          temperature, and speed.
        </p>
        {/* Category Selector — full width above the two-column grid */}
        <div className={styles.categoryGroup}>
          <JoinedButtonGroup
            data={[
              { id: 'uc1', title: 'Length', value: 'Length' },
              { id: 'uc2', title: 'Area', value: 'Area' },
              { id: 'uc3', title: 'Weight', value: 'Weight' },
              { id: 'uc4', title: 'Volume', value: 'Volume' },
            ]}
            selectedValue={category}
            updateSelectedValue={handleCategoryChange}
            btnClass={styles.btnTopRow}
            sizePrefix="md"
          />
          <JoinedButtonGroup
            data={[
              { id: 'uc5', title: 'Temperature', value: 'Temperature' },
              { id: 'uc6', title: 'Speed', value: 'Speed' },
              { id: 'uc7', title: 'Data', value: 'Data' },
            ]}
            selectedValue={category}
            updateSelectedValue={handleCategoryChange}
            btnClass={styles.btnBottomRow}
            sizePrefix="md"
          />
        </div>
        {/* Two-column grid on tablet+: inputs left, results right */}
        <div className={styles.converterGrid}>
          {/* LEFT COLUMN — input rows + swap */}
          <div className={styles.inputsCol}>
            <div className={styles.converterRows}>
              <UnitInputRow
                label="From"
                value={inputValue}
                onChange={setInputValue}
                unit={fromUnit}
                onUnitChange={setFromUnit}
                availableUnits={allUnits}
              />
              <div className={styles.swapWrapper}>
                <button
                  type="button"
                  onClick={handleSwap}
                  className={styles.swapCircleBtn}
                  title="Swap units"
                  aria-label="Swap units"
                >
                  <FiRepeat />
                </button>
              </div>
              <UnitInputRow
                label="To"
                value={outputValue}
                unit={toUnit}
                onUnitChange={setToUnit}
                availableUnits={allUnits}
                readOnly
                isResult
              />
            </div>
          </div>
          {/* RIGHT COLUMN — hero result + equivalents (sticky on web) */}
          <div className={styles.resultsCol}>
            {/* Hero result card */}
            <div className={`${styles.card} ${styles.heroCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Result</span>
                {unitRatio && (
                  <span className={styles.formulaBadge}>
                    1 {fromUnit} = {unitRatio} {toUnit}
                  </span>
                )}
              </div>
              <div className={styles.heroValueRow}>
                <span className={styles.heroValue}>{outputValue || '—'}</span>
                <span className={styles.heroUnit}>{toUnit}</span>
              </div>
              {hasValue && outputValue && (
                <div style={{ fontSize: '0.8125rem', opacity: 0.7 }}>
                  {inputValue} {fromUnit} = {outputValue} {toUnit}
                </div>
              )}
            </div>
            {/* All-units equivalents panel */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>All {category} Equivalents</span>
              </div>
              <div className={styles.equivalentsGrid}>
                {equivalents.map(({ unit, display }) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setToUnit(unit)}
                    className={`${styles.equivalentItem}${unit === toUnit ? ` ${styles.equivalentItemActive}` : ''}`}
                    title={`Set ${unit} as target`}
                  >
                    <span className={styles.equivalentUnit}>{unit}</span>
                    <span className={styles.equivalentVal}>{display}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    </main>
  );
};
export default UnitConverter;
