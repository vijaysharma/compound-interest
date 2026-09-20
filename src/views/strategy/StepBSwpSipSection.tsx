import React from 'react';
import { SwpConfigSubColumn } from './SwpConfigSubColumn';
import { SipConfigSubColumn } from './SipConfigSubColumn';
import { SwpConfig, SipConfig, SelectedFund } from './types';
import styles from './StrategyCalculator.module.scss';
interface StepBSwpSipSectionProps {
  swpConfig: SwpConfig;
  onUpdateSwpConfig: (config: SwpConfig) => void;
  sipConfig: SipConfig;
  onUpdateSipConfig: (config: SipConfig) => void;
  sipFunds: SelectedFund[];
  onUpdateSipFunds: (funds: SelectedFund[]) => void;
}
export const StepBSwpSipSection: React.FC<StepBSwpSipSectionProps> = ({
  swpConfig,
  onUpdateSwpConfig,
  sipConfig,
  onUpdateSipConfig,
  sipFunds,
  onUpdateSipFunds,
}) => {
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>Step B</div>
        <div className={styles.stageTitleGroup}>
          <h2 className={styles.stageTitle}>SWP Harvesting &amp; Parallel SIP Reinvestment</h2>
          <span className={styles.stageSubtitle}>Systematic cash flows &amp; staged portfolio allocation</span>
        </div>
      </div>
      <div className={styles.splitConfigGrid}>
        <SwpConfigSubColumn swpConfig={swpConfig} onUpdateSwpConfig={onUpdateSwpConfig} />
        <SipConfigSubColumn
          sipConfig={sipConfig}
          onUpdateSipConfig={onUpdateSipConfig}
          sipFunds={sipFunds}
          onUpdateSipFunds={onUpdateSipFunds}
        />
      </div>
    </section>
  );
};
