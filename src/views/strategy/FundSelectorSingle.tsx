import React from 'react';
import { FiCheckCircle, FiSearch } from 'react-icons/fi';
import { FundType } from './types';
import { FundSearchDropdown } from './FundSearchDropdown';
import styles from './StrategyCalculator.module.scss';
interface FundSelectorSingleProps {
  selectedFund: {
    fundId: string;
    schemeName: string;
    fundType?: FundType;
    expectedCagr?: number;
  };
  onSelectFund: (fund: {
    fundId: string;
    schemeName: string;
    fundType?: FundType;
    expectedCagr?: number;
  }) => void;
}
export const FundSelectorSingle: React.FC<FundSelectorSingleProps> = ({
  selectedFund,
  onSelectFund,
}) => {
  const handleFundChosen = (chosen: { fundId: string; schemeName: string }) => {
    const isDebt = chosen.schemeName.toLowerCase().includes('bond') || chosen.schemeName.toLowerCase().includes('debt');
    onSelectFund({
      fundId: chosen.fundId,
      schemeName: chosen.schemeName,
      fundType: isDebt ? 'debt' : 'equity',
      expectedCagr: isDebt ? 7.5 : 12.5,
    });
  };
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>02</div>
        <div className={styles.stageTitleGroup}>
          <div className={styles.fundHeaderTitleRow}>
            <h3 className={styles.stageTitle}>Mutual Fund Selection</h3>
            <span className={styles.singleFundLockedBadge}>
              <FiCheckCircle />
              <span>100% Locked Allocation</span>
            </span>
          </div>
          <span className={styles.stageSubtitle}>
            Single primary wealth-accumulation vehicle executing real daily NAV accounting
          </span>
        </div>
      </div>
      <div className={styles.singleFundCard}>
        <div className={styles.singleFundMetaRow}>
          <span className={styles.fundIndexDot} data-fund-index="0" />
          <div className={styles.singleFundInfo}>
            <h4 className={styles.singleFundName}>{selectedFund.schemeName}</h4>
            <div className={styles.singleFundPills}>
              <span className={styles.fundCodePill}>Code: {selectedFund.fundId}</span>
              <span className={selectedFund.fundType === 'debt' ? styles.tagDebt : styles.tagEquity}>
                {(selectedFund.fundType || 'equity').toUpperCase()}
              </span>
              <span className={styles.alloc100Pill}>100% Portfolio Split</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.switchFundSection}>
        <span className={styles.switchFundLabel}>
          <FiSearch className={styles.inlineIcon} /> Switch Core Mutual Fund
        </span>
        <FundSearchDropdown onSelect={handleFundChosen} />
      </div>
    </section>
  );
};
