import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import PairedPicker from '../../components/PairedPicker';
import DateRangePicker from '../../components/DateRangePicker';
import { DEFAULT_RATE_STEPS, getTenureStepData } from '../../data/valuePickerData';
import styles from '../tempValuePickerPage.module.scss';
interface ScaledVariantsSectionProps {
  demoRoi: string;
  setDemoRoi: (v: string) => void;
  demoTenure: string;
  setDemoTenure: (v: string) => void;
  demoTenureUnit: 'm' | 'y';
  setDemoTenureUnit: (v: 'm' | 'y') => void;
  demoSource: string;
  setDemoSource: (v: string) => void;
  demoTarget: string;
  setDemoTarget: (v: string) => void;
  demoStartDate: string;
  setDemoStartDate: (v: string) => void;
  demoEndDate: string;
  setDemoEndDate: (v: string) => void;
}
const SOURCE_OPTIONS = [
  { label: 'India', value: 'India' },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'Germany', value: 'Germany' },
];
const TARGET_OPTIONS = [
  { label: 'United States', value: 'United States' },
  { label: 'Canada', value: 'Canada' },
  { label: 'Australia', value: 'Australia' },
  { label: 'Japan', value: 'Japan' },
];
export const ScaledVariantsSection: React.FC<ScaledVariantsSectionProps> = ({
  demoRoi,
  setDemoRoi,
  demoTenure,
  setDemoTenure,
  demoTenureUnit,
  setDemoTenureUnit,
  demoSource,
  setDemoSource,
  demoTarget,
  setDemoTarget,
  demoStartDate,
  setDemoStartDate,
  demoEndDate,
  setDemoEndDate,
}) => {
  return (
    <section>
      <h2 className={styles.sectionTitle}>Screenshot Use Cases &amp; Scaled Variants</h2>
      <div className={styles.variationsGrid}>
        {/* Case 1: Rate of Interest (%) */}
        <div className={styles.variationCard}>
          <h3>Case 1: Rate of Interest (%)</h3>
          <p>Generic ValuePicker with % symbol, merged title, and quick rate steps.</p>
          <ValuePicker
            title="Rate of Interest"
            titleStyle="merged"
            symbol="%"
            value={demoRoi}
            min={0}
            max={30}
            defaultStep={0.1}
            stepData={DEFAULT_RATE_STEPS}
            singleRow={true}
            showWords={false}
            onChange={setDemoRoi}
          />
          <div className={styles.variationResultText}>Current ROI: {demoRoi}%</div>
        </div>
        {/* Case 2: Tenure Stepper */}
        <div className={styles.variationCard}>
          <h3>Case 2: Tenure Picker</h3>
          <p>Generic ValuePicker with format unit selector in endAdornment and quick tenure steps.</p>
          <ValuePicker
            title="Tenure"
            titleStyle="merged"
            value={demoTenure}
            min={1}
            max={100}
            defaultStep={1}
            stepData={getTenureStepData(demoTenureUnit)}
            singleRow={true}
            showWords={false}
            endAdornment={
              <select
                value={demoTenureUnit}
                onChange={(e) => setDemoTenureUnit(e.target.value as 'y' | 'm')}
                className={styles.adornmentSelect}
              >
                <option value="y">Years</option>
                <option value="m">Months</option>
              </select>
            }
            onChange={setDemoTenure}
          />
          <div className={styles.variationResultText}>
            Current Tenure: {demoTenure} {demoTenureUnit === 'y' ? 'Years' : 'Months'}
          </div>
        </div>
        {/* Case 3: Paired / Dual Endpoint */}
        <div className={styles.variationCard}>
          <h3>Case 3: Paired / Dual Endpoint Selector</h3>
          <p>Dedicated PairedPicker component with [Source] and [Target] purple badges.</p>
          <PairedPicker
            sourceBadgeText="Source"
            targetBadgeText="Target"
            sourceValue={demoSource}
            onSourceChange={setDemoSource}
            targetValue={demoTarget}
            onTargetChange={setDemoTarget}
            sourceOptions={SOURCE_OPTIONS}
            targetOptions={TARGET_OPTIONS}
          />
          <div className={styles.variationResultText}>
            Selected Route: {demoSource} ➔ {demoTarget}
          </div>
        </div>
        {/* Case 4: Dual Date Range */}
        <div className={styles.variationCard}>
          <h3>Case 4: Dual Date Range Picker</h3>
          <p>Dedicated DateRangePicker component with [Start] and [End] labels.</p>
          <DateRangePicker
            startTitle="Start"
            endTitle="End"
            startDate={demoStartDate}
            setStartDate={setDemoStartDate}
            endDate={demoEndDate}
            setEndDate={setDemoEndDate}
          />
          <div className={styles.variationResultText}>
            Selected Range: {demoStartDate} to {demoEndDate}
          </div>
        </div>
      </div>
    </section>
  );
};
