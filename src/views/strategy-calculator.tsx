'use client';
import React, { useEffect, useState } from 'react';
import SEOHead from '../components/SEOHead';
import { useStrategyState } from './strategy/useStrategyState';
import { MobileFallbackBanner } from './strategy/MobileFallbackBanner';
import { StrategyHeader } from './strategy/StrategyHeader';
import { StepALumpsumSection } from './strategy/StepALumpsumSection';
import { StepBSwpSipSection } from './strategy/StepBSwpSipSection';
import { StepCTopUpsSection } from './strategy/StepCTopUpsSection';
import { StepDTaxationSection } from './strategy/StepDTaxationSection';
import { StrategyTimelineTable } from './strategy/StrategyTimelineTable';
import { StrategyChartSection } from './strategy/StrategyChartSection';
import styles from './strategy/StrategyCalculator.module.scss';
const StrategyCalculatorView: React.FC = () => {
  const state = useStrategyState();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const seoTitle = 'Advanced Multi-Stage Investment & SWP/SIP Strategy Calculator | Rupee Calculator';
  const seoDesc = 'Simulate two-tier capital trajectories: lumpsum deployment across mutual funds, staged SWP redemptions with dynamic step-ups, parallel SIP wealth compounding, and stage-by-stage STCG & LTCG tax tracking.';
  return (
    <main className={styles.pageContainer}>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonicalPath="/strategy-calculator"
      />
      {mounted && !isDesktop && <MobileFallbackBanner />}
      <div className={styles.desktopWorkspace}>
        <StrategyHeader summary={state.simulationResult.summary} />
        <StepALumpsumSection
          investmentDate={state.investmentDate}
          onInvestmentDateChange={state.setInvestmentDate}
          investmentAmount={state.investmentAmount}
          onInvestmentAmountChange={state.setInvestmentAmount}
          sourceFunds={state.sourceFunds}
          onUpdateSourceFunds={state.setSourceFunds}
        />
        <StepBSwpSipSection
          swpConfig={state.swpConfig}
          onUpdateSwpConfig={state.setSwpConfig}
          sipConfig={state.sipConfig}
          onUpdateSipConfig={state.setSipConfig}
          sipFunds={state.sipFunds}
          onUpdateSipFunds={state.setSipFunds}
        />
        <StepCTopUpsSection
          topUps={state.topUps}
          onAddTopUp={state.handleAddTopUp}
          onRemoveTopUp={state.handleRemoveTopUp}
          durationYears={state.durationYears}
          onDurationChange={state.setDurationYears}
        />
        <StepDTaxationSection
          summary={state.simulationResult.summary}
          stages={state.simulationResult.stages}
        />
        <StrategyChartSection
          stages={state.simulationResult.stages}
          initialAmount={parseFloat(state.investmentAmount) || 0}
        />
        <StrategyTimelineTable stages={state.simulationResult.stages} />
      </div>
    </main>
  );
};
export default StrategyCalculatorView;
