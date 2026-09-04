import React, { useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead.tsx';
import { HiArrowsRightLeft } from 'react-icons/hi2';
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
    cent: 40.468564224, // 1/100 acre = 435.6 sq ft
    'kottah (WB)': 66.8901888, // 720 sq ft
    'katha (Bihar)': 126.4642632, // 1,361.25 sq ft
    'katha (Assam)': 267.5607552, // 2,880 sq ft
    'katha (UP)': 126.3481344, // 1,360 sq ft
    guntha: 101.17141056, // 1,089 sq ft
    'ground (TN)': 222.967296, // 2,400 sq ft
    'bigha (WB)': 1337.803776, // 14,400 sq ft
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
  label: string;
  value: string;
  onChange?: (val: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  availableUnits: string[];
  readOnly?: boolean;
  isResult?: boolean;
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
}) => (
  <div className="flex-1 w-full min-w-0">
    <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
      {label}
    </label>
    <div className="flex gap-2">
      <input
        type={readOnly ? 'text' : 'number'}
        className={`input input-sm input-primary input-bordered w-full ${
          isResult ? 'bg-success/10 text-success font-bold' : ''
        }`}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={readOnly ? '0' : 'Enter value'}
        readOnly={readOnly}
      />
      <select
        className="select select-sm select-bordered select-primary max-w-[150px] font-medium"
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
  </div>
);
const STORAGE_KEY = 'unit_converter_state';
interface SavedState {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  inputValue: string;
}
const getSavedState = (): SavedState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          category: parsed.category || 'Length',
          fromUnit: parsed.fromUnit || 'm',
          toUnit: parsed.toUnit || 'ft',
          inputValue: parsed.inputValue || '1',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load unit converter state:', err);
  }
  return {
    category: 'Length',
    fromUnit: 'm',
    toUnit: 'ft',
    inputValue: '1',
  };
};
const UnitConverter: React.FC = () => {
  const categories: UnitCategory[] = [
    'Length',
    'Area',
    'Weight',
    'Volume',
    'Temperature',
    'Speed',
    'Data',
  ];
  const [saved] = useState<SavedState>(getSavedState);
  const [category, setCategory] = useState<UnitCategory>(saved.category);
  const [fromUnit, setFromUnit] = useState<string>(saved.fromUnit);
  const [toUnit, setToUnit] = useState<string>(saved.toUnit);
  const [inputValue, setInputValue] = useState<string>(saved.inputValue);
  // Persist state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ category, fromUnit, toUnit, inputValue })
      );
    } catch (err) {
      console.warn('Failed to persist unit converter state:', err);
    }
  }, [category, fromUnit, toUnit, inputValue]);
  // Handle category change
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
  // Calculate output on the fly during render
  let outputValue = '';
  const val = parseFloat(inputValue);
  if (!isNaN(val)) {
    if (category === 'Temperature') {
      let c = 0;
      if (fromUnit === 'C') c = val;
      else if (fromUnit === 'F') c = ((val - 32) * 5) / 9;
      else if (fromUnit === 'K') c = val - 273.15;
      let result = 0;
      if (toUnit === 'C') result = c;
      else if (toUnit === 'F') result = (c * 9) / 5 + 32;
      else if (toUnit === 'K') result = c + 273.15;
      outputValue = result.toLocaleString(undefined, { maximumFractionDigits: 6 });
    } else {
      const catData = unitTypes[category];
      const fromFactor = catData?.[fromUnit as keyof typeof catData];
      const toFactor = catData?.[toUnit as keyof typeof catData];
      if (fromFactor && toFactor) {
        const result = (val * fromFactor) / toFactor;
        outputValue = result.toLocaleString(undefined, { maximumFractionDigits: 6 });
      }
    }
  }
  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(outputValue.replace(/,/g, ''));
  };
  const getAvailableUnits = () => {
    if (category === 'Temperature') return ['C', 'F', 'K'];
    return Object.keys(unitTypes[category]);
  };
  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-8">
      <SEOHead
        title="Unit Converter — Length, Area, Weight, Temp | Rupee Calculator"
        description="Free online unit converter tool. Convert land area (Cent, Kottah, Katha, Acre, Guntha), length, weight, volume, temperature, and speed instantly."
        canonicalPath="/utilities/unit-converter"
      />
      <div>
        {/* Category Selector */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => handleCategoryChange(c)}
              className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`}
            >
              {c}
            </button>
          ))}
        </div>
        {/* Converter Logic: Single row input container */}
        <div className="bg-base-100 border border-base-300 rounded-xl p-6 shadow-sm max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <UnitInputRow
              label="From"
              value={inputValue}
              onChange={setInputValue}
              unit={fromUnit}
              onUnitChange={setFromUnit}
              availableUnits={getAvailableUnits()}
            />
            {/* Swap Button */}
            <div className="flex justify-center pt-2 md:pt-5 shrink-0">
              <button
                type="button"
                onClick={handleSwap}
                className="btn btn-circle btn-sm btn-ghost bg-base-200 hover:bg-base-300 hover:text-primary transition-all shadow-sm"
                title="Swap units"
                aria-label="Swap units"
              >
                <HiArrowsRightLeft className="w-4 h-4" />
              </button>
            </div>
            <UnitInputRow
              label="To"
              value={outputValue}
              unit={toUnit}
              onUnitChange={setToUnit}
              availableUnits={getAvailableUnits()}
              readOnly
              isResult
            />
          </div>
        </div>
      </div>
    </main>
  );
};
export default UnitConverter;
