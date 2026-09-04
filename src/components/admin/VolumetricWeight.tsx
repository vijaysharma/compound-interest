import React, { useState, useEffect } from 'react';
import { FiBox } from 'react-icons/fi';
const STORAGE_KEY = 'volumetric_weight_state';
interface SavedState {
  unit: 'cm' | 'inch';
  length: string;
  breadth: string;
  height: string;
}
const getSavedState = (): SavedState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          unit: parsed.unit === 'inch' ? 'inch' : 'cm',
          length: parsed.length ?? '',
          breadth: parsed.breadth ?? '',
          height: parsed.height ?? '',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load volumetric weight state:', err);
  }
  return { unit: 'cm', length: '', breadth: '', height: '' };
};
const VolumetricWeight: React.FC = () => {
  const [saved] = useState<SavedState>(getSavedState);
  const [unit, setUnit] = useState<'cm' | 'inch'>(saved.unit);
  const [length, setLength] = useState(saved.length);
  const [breadth, setBreadth] = useState(saved.breadth);
  const [height, setHeight] = useState(saved.height);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ unit, length, breadth, height }));
    } catch (err) {
      console.warn('Failed to persist volumetric weight state:', err);
    }
  }, [unit, length, breadth, height]);
  const l = parseFloat(length) || 0;
  const b = parseFloat(breadth) || 0;
  const h = parseFloat(height) || 0;
  const toCm = (val: number) => (unit === 'cm' ? val : val * 2.54);
  const toInch = (val: number) => (unit === 'inch' ? val : val / 2.54);
  const lCm = toCm(l);
  const bCm = toCm(b);
  const hCm = toCm(h);
  const volumetricWeight = (lCm * bCm * hCm) / 5000;
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="card-title text-lg flex items-center gap-2">
            <FiBox className="text-primary" /> Volumetric Weight Calculator
          </h2>
          <p className="text-sm opacity-70">
            Calculate shipping weight based on package dimensions.
          </p>
        </div>
        <div className="flex gap-1 bg-base-200 p-1 rounded-lg w-full sm:w-auto shrink-0">
          <button
            className={`btn btn-sm flex-1 sm:flex-none ${unit === 'cm' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setUnit('cm')}
          >
            Centimeters
          </button>
          <button
            className={`btn btn-sm flex-1 sm:flex-none ${unit === 'inch' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setUnit('inch')}
          >
            Inches
          </button>
        </div>
      </div>
      <div className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold opacity-70 mb-1">Length ({unit})</label>
            <input
              type="number"
              className="input input-sm input-primary input-bordered w-full"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="0"
            />
            <div className="text-[10px] font-medium opacity-50 mt-1 text-right">
              {unit === 'cm' ? `${toInch(l).toFixed(2)} in` : `${toCm(l).toFixed(2)} cm`}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold opacity-70 mb-1">Breadth ({unit})</label>
            <input
              type="number"
              className="input input-sm input-primary input-bordered w-full"
              value={breadth}
              onChange={(e) => setBreadth(e.target.value)}
              placeholder="0"
            />
            <div className="text-[10px] font-medium opacity-50 mt-1 text-right">
              {unit === 'cm' ? `${toInch(b).toFixed(2)} in` : `${toCm(b).toFixed(2)} cm`}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold opacity-70 mb-1">Height ({unit})</label>
            <input
              type="number"
              className="input input-sm input-primary input-bordered w-full"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="0"
            />
            <div className="text-[10px] font-medium opacity-50 mt-1 text-right">
              {unit === 'cm' ? `${toInch(h).toFixed(2)} in` : `${toCm(h).toFixed(2)} cm`}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-success/10 text-success rounded-xl flex justify-between items-center shadow-inner">
        <span className="text-xs font-bold uppercase tracking-wider">Volumetric Weight</span>
        <span className="text-2xl font-bold">
          {volumetricWeight > 0 ? volumetricWeight.toFixed(3) : '0.000'} kg
        </span>
      </div>
    </>
  );
};
export default VolumetricWeight;
