import React, { useState } from 'react';
import ValuePicker from '../components/ValuePicker';
import {
  DEFAULT_VALUE_PICKER_ROWS,
  DEFAULT_VALUE_PICKER_TABS,
  DEFAULT_DURATION_MATRIX_ROWS,
} from '../data/valuePickerData';
import styles from './tempValuePickerPage.module.scss';
import { sanctnum } from '../utilities/numSanitity';
import { TbDeviceMobile, TbDeviceTablet, TbDeviceDesktop } from 'react-icons/tb';
export const TempValuePickerPage: React.FC = () => {
  // Main replica state (exact values from the reference image)
  const [mainValue, setMainValue] = useState<string>('3000000');
  const [mainTab, setMainTab] = useState<string>('one-time');
  // Viewport switcher state: 'mobile' | 'tablet' | 'desktop'
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  // Variation 1: SIP Monthly Amount (No tabs, custom title)
  const [sipValue, setSipValue] = useState<string>('25000');
  // Variation 2: Target Retirement Corpus (USD Currency, large steps)
  const [usdValue, setUsdValue] = useState<string>('500000');
  // Scaled Cases State (from screenshots)
  // Case 1: Rate of Interest (starts at 7.1% from Screenshot 1)
  const [demoRoi, setDemoRoi] = useState<string>('7.1');
  // Case 2: Tenure (starts at 2 Years from Screenshot 2)
  const [demoTenure, setDemoTenure] = useState<string>('2');
  const [demoTenureUnit, setDemoTenureUnit] = useState<'m' | 'y'>('y');
  // Case 3: Paired Endpoint (starts at India -> United States from Screenshot 3)
  const [demoSource, setDemoSource] = useState<string>('India');
  const [demoTarget, setDemoTarget] = useState<string>('United States');
  // Case 4: Date Range (starts at 2026-06-10 to 2026-09-08 from Screenshot 4)
  const [demoStartDate, setDemoStartDate] = useState<string>('2026-06-10');
  const [demoEndDate, setDemoEndDate] = useState<string>('2026-09-08');
  // Case 5: Duration Grid (starts at 1D from Screenshot 5)
  const [demoGridItem, setDemoGridItem] = useState<string>('d-1d');
  const usdSteps = [
    [
      { label: '$1M', value: 1_000_000 },
      { label: '$500K', value: 500_000 },
      { label: '$100K', value: 100_000 },
      { label: '$25K', value: 25_000 },
      { label: '$5K', value: 5_000 },
    ],
    [
      { label: '$1K', value: 1_000 },
      { label: '$500', value: 500 },
      { label: '$250', value: 250 },
      { label: '$100', value: 100 },
      { label: '$50', value: 50 },
    ],
  ];
  return (
    <div className={styles.demoPage}>
      {/* Header */}
      <header className={styles.demoHeader}>
        <span className={styles.badge}>Component Preview</span>
        <h1 className={styles.pageTitle}>ValuePicker Component</h1>
        <p className={styles.pageSubtitle}>
          Mobile-first, fully responsive numeric selector styled with modular SCSS. Recreated
          from the reference design with dual-mode tabs, quick-step grid, and real-time words
          formatting.
        </p>
        {/* Responsive Viewport Simulator Controls */}
        <div className={styles.viewportSwitcher} role="group" aria-label="Viewport Preview Mode">
          <button
            type="button"
            className={`${styles.viewportBtn} ${viewport === 'mobile' ? styles.active : ''}`}
            onClick={() => setViewport('mobile')}
          >
            <TbDeviceMobile size={18} />
            Mobile (375px)
          </button>
          <button
            type="button"
            className={`${styles.viewportBtn} ${viewport === 'tablet' ? styles.active : ''}`}
            onClick={() => setViewport('tablet')}
          >
            <TbDeviceTablet size={18} />
            Tablet (640px)
          </button>
          <button
            type="button"
            className={`${styles.viewportBtn} ${viewport === 'desktop' ? styles.active : ''}`}
            onClick={() => setViewport('desktop')}
          >
            <TbDeviceDesktop size={18} />
            Desktop / Full Web
          </button>
        </div>
      </header>
      <main className={styles.demoContainer}>
        {/* Interactive Reference Model Preview */}
        <section>
          <div className={styles.previewArea}>
            <div
              className={`${styles.frameWrapper} ${
                viewport === 'mobile'
                  ? styles.mobileFrame
                  : viewport === 'tablet'
                    ? styles.tabletFrame
                    : styles.desktopFrame
              }`}
            >
              <ValuePicker
                value={mainValue}
                onChange={setMainValue}
                tabs={DEFAULT_VALUE_PICKER_TABS}
                activeTab={mainTab}
                onTabChange={setMainTab}
                stepRows={DEFAULT_VALUE_PICKER_ROWS}
                currencySymbol="₹"
                locale="en-IN"
                showWords={true}
                layout={viewport === 'mobile' ? 'mobile' : viewport === 'desktop' ? 'desktop' : 'auto'}
              />
              {/* State Inspector */}
              <div className={styles.inspectorCard}>
                <h4>Live State Inspector</h4>
                <div className={styles.stateGrid}>
                  <div className={styles.stateItem}>
                    <span className={styles.label}>Active Mode</span>
                    <span className={styles.val}>
                      {mainTab === 'one-time' ? 'One time amount' : 'Target amount'}
                    </span>
                  </div>
                  <div className={styles.stateItem}>
                    <span className={styles.label}>Formatted Value</span>
                    <span className={styles.val}>
                      ₹{sanctnum(mainValue).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.stateItem}>
                    <span className={styles.label}>Raw Numeric String</span>
                    <span className={styles.val}>{mainValue}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Additional Real-World Configurations */}
        <section>
          <h2 className={styles.sectionTitle}>Responsive Web Variations & Reusability</h2>
          <div className={styles.variationsGrid}>
            {/* Variation 1: Standalone Field without tabs */}
            <div className={styles.variationCard}>
              <h3>1. Standalone Input (No Tabs)</h3>
              <p>Ideal for regular form inputs with a custom title.</p>
              <ValuePicker
                title="Monthly SIP Contribution"
                value={sipValue}
                onChange={setSipValue}
                tabs={[]}
                currencySymbol="₹"
                locale="en-IN"
                showWords={true}
              />
            </div>
            {/* Variation 2: International / USD Custom Steps */}
            <div className={styles.variationCard}>
              <h3>2. Custom Currency & Step Presets</h3>
              <p>Works seamlessly with custom currencies (e.g. USD $) and custom step presets.</p>
              <ValuePicker
                title="Target Retirement Corpus ($)"
                value={usdValue}
                onChange={setUsdValue}
                tabs={[]}
                stepRows={usdSteps}
                currencySymbol="$"
                locale="en-US"
                showWords={true}
              />
            </div>
          </div>
        </section>
        {/* Scaled Variants Section matching Screenshots 1-5 */}
        <section>
          <h2 className={styles.sectionTitle}>Screenshot Use Cases & Scaled Variants</h2>
          <div className={styles.variationsGrid}>
            {/* Case 1: Rate of Interest (%) */}
            <div className={styles.variationCard}>
              <h3>Case 1: Rate of Interest (%)</h3>
              <p>Inline control bar with quick decimal steps [0.01] [0.1] [1], value input, and [+] / [-] operation mode.</p>
              <ValuePicker.ROI
                value={demoRoi}
                onChange={setDemoRoi}
              />
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6d0b74', fontWeight: 600 }}>
                Current ROI: {demoRoi}%
              </div>
            </div>
            {/* Case 2: Tenure Stepper */}
            <div className={styles.variationCard}>
              <h3>Case 2: Tenure Stepper</h3>
              <p>Inline control bar with decrement steps [-10] [-1], value input, increment steps [+1] [+10], and [M] / [Y] unit switcher.</p>
              <ValuePicker.Tenure
                value={demoTenure}
                onChange={setDemoTenure}
                unit={demoTenureUnit}
                onUnitChange={setDemoTenureUnit}
              />
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6d0b74', fontWeight: 600 }}>
                Current Tenure: {demoTenure} {demoTenureUnit === 'y' ? 'Years' : 'Months'}
              </div>
            </div>
            {/* Case 3: Paired / Dual Endpoint */}
            <div className={styles.variationCard}>
              <h3>Case 3: Paired / Dual Endpoint Selector</h3>
              <p>Joined selector bar with [Source] and [Target] purple badges and thin central divider.</p>
              <ValuePicker.Paired
                sourceBadgeText="Source"
                targetBadgeText="Target"
                sourceValue={demoSource}
                onSourceChange={setDemoSource}
                targetValue={demoTarget}
                onTargetChange={setDemoTarget}
                sourceOptions={[
                  { label: 'India', value: 'India' },
                  { label: 'United Kingdom', value: 'United Kingdom' },
                  { label: 'Singapore', value: 'Singapore' },
                  { label: 'Germany', value: 'Germany' },
                ]}
                targetOptions={[
                  { label: 'United States', value: 'United States' },
                  { label: 'Canada', value: 'Canada' },
                  { label: 'Australia', value: 'Australia' },
                  { label: 'Japan', value: 'Japan' },
                ]}
              />
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6d0b74', fontWeight: 600 }}>
                Selected Route: {demoSource} ➔ {demoTarget}
              </div>
            </div>
            {/* Case 4: Dual Date Range */}
            <div className={styles.variationCard}>
              <h3>Case 4: Dual Date Range Picker</h3>
              <p>Joined selector bar with [Start] and [End] purple badges and native HTML5 date pickers.</p>
              <ValuePicker.DateRange
                startBadgeText="Start"
                endBadgeText="End"
                startDate={demoStartDate}
                setStartDate={setDemoStartDate}
                endDate={demoEndDate}
                setEndDate={setDemoEndDate}
              />
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6d0b74', fontWeight: 600 }}>
                Selected Range: {demoStartDate} to {demoEndDate}
              </div>
            </div>
            {/* Case 5: Duration Matrix Grid */}
            <div className={styles.variationCard} style={{ gridColumn: '1 / -1' }}>
              <h3>Case 5: Multi-Row Duration Matrix Grid (3x8)</h3>
              <p>Duration matrix grid with 24 duration presets (1D to 20Y) with purple border and selected cell fill.</p>
              <ValuePicker.Grid
                title="Duration Matrix"
                gridRows={DEFAULT_DURATION_MATRIX_ROWS}
                selectedGridId={demoGridItem}
                onGridSelect={(item) => setDemoGridItem(item.id)}
              />
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6d0b74', fontWeight: 600 }}>
                Selected Duration: {DEFAULT_DURATION_MATRIX_ROWS.flat().find((i) => i.id === demoGridItem)?.title || demoGridItem}
              </div>
            </div>
          </div>
        </section>
        {/* Code Snippet for Easy Integration */}
        <section>
          <h2 className={styles.sectionTitle}>How to Integrate All 5 Variants</h2>
          <pre className={styles.codeSnippet}>
{`// 1. Amount Picker (Classic currency with tabs & quick steps):
<ValuePicker value={amount} onChange={setAmount} tabs={tabs} currencySymbol="₹" />

// 2. Rate of Interest (%) (Screenshot 1):
<ValuePicker.ROI value={roi} onChange={setRoi} />
// or using rt state: <ValuePicker.ROI rt={rt} setRt={setRt} />

// 3. Tenure Stepper (Screenshot 2):
<ValuePicker.Tenure value={tenure} onChange={setTenure} unit={unit} onUnitChange={setUnit} />
// or using rt state: <ValuePicker.Tenure rt={rt} setRt={setRt} />

// 4. Paired Endpoint (Screenshot 3):
<ValuePicker.Paired
  sourceBadgeText="Source" targetBadgeText="Target"
  sourceValue={source} onSourceChange={setSource}
  targetValue={target} onTargetChange={setTarget}
/>

// 5. Date Range (Screenshot 4):
<ValuePicker.DateRange
  startBadgeText="Start" endBadgeText="End"
  startDate={startDate} setStartDate={setStartDate}
  endDate={endDate} setEndDate={setEndDate}
/>

// 6. Duration Matrix Grid (Screenshot 5):
<ValuePicker.Grid
  gridRows={DEFAULT_DURATION_MATRIX_ROWS}
  selectedGridId={gridId}
  onGridSelect={(item) => setGridId(item.id)}
/>`}
          </pre>
        </section>
      </main>
    </div>
  );
};
export default TempValuePickerPage;
