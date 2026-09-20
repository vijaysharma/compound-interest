'use client';
import React, { useState } from 'react';
import { DemoHeader, ViewportMode } from './temp-value-picker/DemoHeader';
import { InteractiveModelPreview } from './temp-value-picker/InteractiveModelPreview';
import { ResponsiveVariationsSection } from './temp-value-picker/ResponsiveVariationsSection';
import { ScaledVariantsSection } from './temp-value-picker/ScaledVariantsSection';
import { IntegrationSnippetSection } from './temp-value-picker/IntegrationSnippetSection';
import styles from './tempValuePickerPage.module.scss';
export const TempValuePickerPage: React.FC = () => {
  const [mainValue, setMainValue] = useState<string>('3000000');
  const [mainTab, setMainTab] = useState<string>('one-time');
  const [viewport, setViewport] = useState<ViewportMode>('mobile');
  const [sipValue, setSipValue] = useState<string>('25000');
  const [usdValue, setUsdValue] = useState<string>('500000');
  const [demoRoi, setDemoRoi] = useState<string>('7.1');
  const [demoTenure, setDemoTenure] = useState<string>('2');
  const [demoTenureUnit, setDemoTenureUnit] = useState<'m' | 'y'>('y');
  const [demoSource, setDemoSource] = useState<string>('India');
  const [demoTarget, setDemoTarget] = useState<string>('United States');
  const [demoStartDate, setDemoStartDate] = useState<string>('2026-06-10');
  const [demoEndDate, setDemoEndDate] = useState<string>('2026-09-08');
  return (
    <div className={styles.demoPage}>
      <DemoHeader viewport={viewport} setViewport={setViewport} />
      <main className={styles.demoContainer}>
        <InteractiveModelPreview
          viewport={viewport}
          mainValue={mainValue}
          setMainValue={setMainValue}
          mainTab={mainTab}
          setMainTab={setMainTab}
        />
        <ResponsiveVariationsSection
          sipValue={sipValue}
          setSipValue={setSipValue}
          usdValue={usdValue}
          setUsdValue={setUsdValue}
        />
        <ScaledVariantsSection
          demoRoi={demoRoi}
          setDemoRoi={setDemoRoi}
          demoTenure={demoTenure}
          setDemoTenure={setDemoTenure}
          demoTenureUnit={demoTenureUnit}
          setDemoTenureUnit={setDemoTenureUnit}
          demoSource={demoSource}
          setDemoSource={setDemoSource}
          demoTarget={demoTarget}
          setDemoTarget={setDemoTarget}
          demoStartDate={demoStartDate}
          setDemoStartDate={setDemoStartDate}
          demoEndDate={demoEndDate}
          setDemoEndDate={setDemoEndDate}
        />
        <IntegrationSnippetSection />
      </main>
    </div>
  );
};
export default TempValuePickerPage;
