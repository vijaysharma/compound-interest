'use client';
import React, { useEffect, useState } from 'react';
import SEOHead from '../components/SEOHead';
import { useStreamlinesState } from './strategy/useStreamlinesState';
import { MobileFallbackBanner } from './strategy/MobileFallbackBanner';
import { StrategyHeader } from './strategy/StrategyHeader';
import { Column1Inputs } from './strategy/Column1Inputs';
import { Column2Stages } from './strategy/Column2Stages';
import { Column3Analytics } from './strategy/Column3Analytics';
import styles from './strategy/StrategyCalculator.module.scss';
const StrategyCalculatorView: React.FC = () => {
  const state = useStreamlinesState();
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
  const seoTitle =
    'Advanced Multi-Stage Investment & SWP/SIP Strategy Calculator | Rupee Calculator';
  const seoDesc =
    'Simulate two-tier capital trajectories: lumpsum deployment across mutual funds, staged SWP redemptions with dynamic step-ups, parallel SIP wealth compounding, and stage-by-stage STCG & LTCG tax tracking.';
  return (
    <main className={`${styles.pageContainer} strategy-calculator-page`}>
      <SEOHead title={seoTitle} description={seoDesc} canonicalPath="/strategy-calculator" />
      {mounted && !isDesktop && <MobileFallbackBanner />}
      <div className={styles.desktopWorkspace}>
        <StrategyHeader summary={state.activeResult.summary} />
        <div className={styles.threeColumnLayout}>
          <div className={styles.col1Wrapper}>
            <Column1Inputs
              streamlines={state.streamlines}
              activeId={state.activeId}
              activeStreamline={state.activeStreamline}
              onSelectStreamline={state.setActiveId}
              onUpdateActive={state.updateActive}
              onSave={state.saveStreamline}
              onDuplicate={state.duplicateStreamline}
              onAdd={state.addStreamline}
              onDelete={state.deleteStreamline}
              isSaved={state.isSaved}
            />
          </div>
          <div className={styles.col2Wrapper}>
            <Column2Stages
              stages={state.activeResult.stages}
              activeStreamline={state.activeStreamline}
            />
          </div>
          <div className={styles.col3Wrapper}>
            <Column3Analytics
              activeStreamline={state.activeStreamline}
              activeSteps={state.activeResult.monthlySteps}
              allStreamlines={state.allStreamlineResults}
              activeId={state.activeId}
              onSelectStreamline={state.setActiveId}
            />
          </div>
        </div>
      </div>
    </main>
  );
};
export default StrategyCalculatorView;
