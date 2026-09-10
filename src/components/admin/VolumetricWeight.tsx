import React, { useState, useEffect } from 'react';
import { FiBox } from 'react-icons/fi';
import styles from './VolumetricWeight.module.scss';
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
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>
            <FiBox className={styles.titleIcon} /> Volumetric Weight Calculator
          </h2>
          <p className={styles.subtitle}>
            Calculate shipping weight based on package dimensions.
          </p>
        </div>
        <div className={styles.switchGroup}>
          <button
            className={`${styles.switchBtn} ${unit === 'cm' ? styles.active : ''}`}
            onClick={() => setUnit('cm')}
          >
            Centimeters
          </button>
          <button
            className={`${styles.switchBtn} ${unit === 'inch' ? styles.active : ''}`}
            onClick={() => setUnit('inch')}
          >
            Inches
          </button>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.inputGrid}>
          <div className={styles.inputCol}>
            <label className={styles.label}>Length ({unit})</label>
            <input
              type="number"
              className={styles.input}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="0"
            />
            <div className={styles.convertedUnit}>
              {unit === 'cm' ? `${toInch(l).toFixed(2)} in` : `${toCm(l).toFixed(2)} cm`}
            </div>
          </div>
          <div className={styles.inputCol}>
            <label className={styles.label}>Breadth ({unit})</label>
            <input
              type="number"
              className={styles.input}
              value={breadth}
              onChange={(e) => setBreadth(e.target.value)}
              placeholder="0"
            />
            <div className={styles.convertedUnit}>
              {unit === 'cm' ? `${toInch(b).toFixed(2)} in` : `${toCm(b).toFixed(2)} cm`}
            </div>
          </div>
          <div className={styles.inputCol}>
            <label className={styles.label}>Height ({unit})</label>
            <input
              type="number"
              className={styles.input}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="0"
            />
            <div className={styles.convertedUnit}>
              {unit === 'cm' ? `${toInch(h).toFixed(2)} in` : `${toCm(h).toFixed(2)} cm`}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.resultCard}>
        <span className={styles.resultTag}>Volumetric Weight</span>
        <span className={styles.resultVal}>
          {volumetricWeight > 0 ? volumetricWeight.toFixed(3) : '0.000'} kg
        </span>
      </div>
    </>
  );
};
export default VolumetricWeight;
