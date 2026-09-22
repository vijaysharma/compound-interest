import React from 'react';
import styles from '../tempValuePickerPage.module.scss';
const CODE_SAMPLE = `// 1. Amount Picker (Classic currency with tabs & quick steps):
<ValuePicker value={amount} onChange={setAmount} tabs={tabs} symbol="₹" />

// 2. Rate of Interest (%):
<ValuePicker title="Rate" symbol="%" value={roi} onChange={setRoi} stepData={DEFAULT_RATE_STEPS} singleRow />

// 3. Tenure:
<ValuePicker title="Tenure" value={tenure} onChange={setTenure} stepData={getTenureStepData('y')} singleRow endAdornment={<select ... />} />

// 4. Paired Endpoint:
<PairedPicker
  sourceBadgeText="Source" targetBadgeText="Target"
  sourceValue={source} onSourceChange={setSource}
  targetValue={target} onTargetChange={setTarget}
/>

// 5. Single date (variant="date" — one labelled field):
<ValuePicker
  variant="date"
  startTitle="Reinvestment start"
  startDate={startDate} setStartDate={setStartDate}
/>

// 6. Date range (variant="date-range" — a start/end pair):
<ValuePicker
  variant="date-range"
  startTitle="From" endTitle="To"
  startDate={startDate} setStartDate={setStartDate}
  endDate={endDate} setEndDate={setEndDate}
/>`;
export const IntegrationSnippetSection: React.FC = () => {
  return (
    <section>
      <h2 className={styles.sectionTitle}>How to Integrate Generic ValuePicker</h2>
      <pre className={styles.codeSnippet}>{CODE_SAMPLE}</pre>
    </section>
  );
};
