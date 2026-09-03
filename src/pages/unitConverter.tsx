import React, { useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead.tsx';
import { FiArrowRight, FiArrowDown } from 'react-icons/fi';
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
  Weight: {
    mg: 0.000001,
    g: 0.001,
    kg: 1,
    ton: 1000,
    oz: 0.0283495,
    lb: 0.453592,
  },
  Area: {
    'sq m': 1,
    'sq km': 1000000,
    'sq ft': 0.092903,
    'sq yd': 0.836127,
    acre: 4046.86,
    hectare: 10000,
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
const UnitConverter: React.FC = () => {
  const categories: UnitCategory[] = [
    'Length',
    'Weight',
    'Area',
    'Volume',
    'Temperature',
    'Speed',
    'Data',
  ];
  const [category, setCategory] = useState<UnitCategory>('Length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  const [inputValue, setInputValue] = useState('1');
  const [outputValue, setOutputValue] = useState('');
  // Handle category change
  useEffect(() => {
    if (category === 'Temperature') {
      setFromUnit('C');
      setToUnit('F');
    } else {
      const units = Object.keys(unitTypes[category]);
      setFromUnit(units[2] || units[0]); // default e.g., m
      setToUnit(units[5] || units[1]);   // default e.g., ft
    }
  }, [category]);
  // Handle calculation
  useEffect(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) {
      setOutputValue('');
      return;
    }
    if (category === 'Temperature') {
      let c = 0;
      // Convert to Celsius first
      if (fromUnit === 'C') c = val;
      else if (fromUnit === 'F') c = (val - 32) * 5 / 9;
      else if (fromUnit === 'K') c = val - 273.15;
      // Convert Celsius to target
      let result = 0;
      if (toUnit === 'C') result = c;
      else if (toUnit === 'F') result = (c * 9 / 5) + 32;
      else if (toUnit === 'K') result = c + 273.15;
      setOutputValue(result.toLocaleString(undefined, { maximumFractionDigits: 6 }));
    } else {
      // Base conversion (everything to base unit, then to target)
      const catData = unitTypes[category];
      const fromFactor = catData[fromUnit as keyof typeof catData];
      const toFactor = catData[toUnit as keyof typeof catData];
      if (fromFactor && toFactor) {
        const result = (val * fromFactor) / toFactor;
        setOutputValue(result.toLocaleString(undefined, { maximumFractionDigits: 6 }));
      }
    }
  }, [inputValue, fromUnit, toUnit, category]);
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
        title="Unit Converter — Length, Weight, Area, Temp | Rupee Calculator"
        description="Free online unit converter tool. Easily convert length, weight, area, volume, temperature, speed, and data sizes instantly."
        canonicalPath="/utilities/unit-converter"
      />
      <h1 className="text-3xl font-bold mb-6 text-base-content text-center">Unit Converter</h1>
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`}
              >
                {c}
              </button>
            ))}
          </div>
          {/* Converter Logic */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* From */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">From</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter value"
                />
                <select
                  className="select select-bordered"
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                >
                  {getAvailableUnits().map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Swap Button */}
            <div className="flex justify-center mt-6 md:mt-8">
              <button
                onClick={handleSwap}
                className="btn btn-circle btn-ghost"
                title="Swap units"
              >
                <FiArrowRight className="hidden md:block w-6 h-6" />
                <FiArrowDown className="block md:hidden w-6 h-6" />
              </button>
            </div>
            {/* To */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">To</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={outputValue}
                  readOnly
                />
                <select
                  className="select select-bordered"
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                >
                  {getAvailableUnits().map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
export default UnitConverter;
