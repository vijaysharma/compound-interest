import React, { useState } from 'react';
import ValuePicker from '../components/ValuePicker';
import {
  DEFAULT_VALUE_PICKER_ROWS,
  DEFAULT_VALUE_PICKER_TABS,
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
        {/* Code Snippet for Easy Integration */}
        <section>
          <h2 className={styles.sectionTitle}>How to Integrate in Other Pages</h2>
          <pre className={styles.codeSnippet}>
{`import ValuePicker from '../components/ValuePicker';

// Inside your calculator / page component:
const [amount, setAmount] = useState('3000000');
const [mode, setMode] = useState('one-time');

<ValuePicker
  value={amount}
  onChange={setAmount}
  activeTab={mode}
  onTabChange={setMode}
  tabs={[
    { id: 'one-time', title: 'One time amount' },
    { id: 'target', title: 'Target amount' },
  ]}
  currencySymbol="₹"
  locale="en-IN"
  showWords={true}
/>`}
          </pre>
        </section>
      </main>
    </div>
  );
};
export default TempValuePickerPage;
