import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import styles from '../tempValuePickerPage.module.scss';
interface ResponsiveVariationsSectionProps {
  sipValue: string;
  setSipValue: (v: string) => void;
  usdValue: string;
  setUsdValue: (v: string) => void;
}
const USD_STEPS = [
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
export const ResponsiveVariationsSection: React.FC<ResponsiveVariationsSectionProps> = ({
  sipValue,
  setSipValue,
  usdValue,
  setUsdValue,
}) => {
  return (
    <section>
      <h2 className={styles.sectionTitle}>Responsive Web Variations &amp; Reusability</h2>
      <div className={styles.variationsGrid}>
        <div className={styles.variationCard}>
          <h3>1. Standalone Input (No Tabs)</h3>
          <p>Ideal for regular form inputs with a custom title.</p>
          <ValuePicker
            title="Monthly SIP Contribution"
            value={sipValue}
            onChange={setSipValue}
            currencySymbol="₹"
            locale="en-IN"
            showWords={true}
          />
        </div>
        <div className={styles.variationCard}>
          <h3>2. Custom Currency &amp; Step Presets</h3>
          <p>Works seamlessly with custom currencies (e.g. USD $) and custom step presets.</p>
          <ValuePicker
            title="Target Retirement Corpus ($)"
            value={usdValue}
            onChange={setUsdValue}
            stepRows={USD_STEPS}
            currencySymbol="$"
            locale="en-US"
            showWords={true}
          />
        </div>
      </div>
    </section>
  );
};
