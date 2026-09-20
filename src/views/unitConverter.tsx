'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import { FiNavigation, FiRepeat } from 'react-icons/fi';
import ValuePicker from '@/components/ValuePicker';
import { useUnitConverterState } from './unit-converter/useUnitConverterState';
import { UnitInputRow } from './unit-converter/UnitInputRow';
import { UnitCategoryButtons } from './unit-converter/UnitCategoryButtons';
import { UnitConverterHeroCard } from './unit-converter/UnitConverterHeroCard';
import { UnitEquivalentsCard } from './unit-converter/UnitEquivalentsCard';
import styles from './UnitConverter.module.scss';
const UnitConverter: React.FC = () => {
  const {
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
  } = useUnitConverterState();
  return (
    <main className={styles.container}>
      <SEOHead
        title="Unit Converter — Length, Area, Weight, Temp | Rupee Calculator"
        description="Free online unit converter tool. Convert land area (Cent, Kottah, Katha, Acre, Guntha), length, weight, volume, temperature, and speed instantly."
        canonicalPath="/utilities/unit-converter"
      />
      <h2 className={styles.title}>
        <FiNavigation className={styles.titleIcon} /> Unit Converter
      </h2>
      <p className={styles.subtitle}>
        Convert between different units of measurement for length, area, weight, volume,
        temperature, and speed.
      </p>
      <div className={styles.converterGrid}>
        <div className={styles.inputsCol}>
          <UnitCategoryButtons
            category={category}
            onCategoryChange={handleCategoryChange}
          />
          <ValuePicker
            variant="paired"
            sourceBadgeText="From"
            targetBadgeText="To"
            sourceSlot={(
              <UnitInputRow
                label="From"
                value={inputValue}
                onChange={setInputValue}
                unit={fromUnit}
                onUnitChange={setFromUnit}
                availableUnits={allUnits}
              />
            )}
            targetSlot={(
              <UnitInputRow
                label="To"
                value={outputValue}
                unit={toUnit}
                onUnitChange={setToUnit}
                availableUnits={allUnits}
                readOnly
                isResult
              />
            )}
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
          <UnitConverterHeroCard
            unitRatio={unitRatio}
            fromUnit={fromUnit}
            toUnit={toUnit}
            outputValue={outputValue}
            inputValue={inputValue}
            hasValue={hasValue}
          />
        </div>
        <div className={styles.resultsCol}>
          <UnitEquivalentsCard
            category={category}
            equivalents={equivalents}
            toUnit={toUnit}
            setToUnit={setToUnit}
          />
        </div>
      </div>
    </main>
  );
};
export default UnitConverter;
