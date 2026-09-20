import React, { useMemo } from 'react';
import { FiTrash2, FiPieChart, FiRefreshCw } from 'react-icons/fi';
import { SelectedFundAllocation } from './column1Types';
import { FundSearchDropdown } from './FundSearchDropdown';
import styles from './StrategyCalculator.module.scss';
interface FundAllocationSectionProps {
  funds: SelectedFundAllocation[];
  onUpdateFunds: (funds: SelectedFundAllocation[]) => void;
  maxFunds?: number;
}
export const FundAllocationSection: React.FC<FundAllocationSectionProps> = ({
  funds,
  onUpdateFunds,
  maxFunds = 4,
}) => {
  const totalAllocation = useMemo(() => {
    return funds.reduce((sum, f) => sum + (f.allocationPercentage || 0), 0);
  }, [funds]);
  const isValid100 = Math.abs(totalAllocation - 100) < 0.1;
  const handleAllocationChange = (fundId: string, percentage: number) => {
    const updated = funds.map((f) => (f.fundId === fundId ? { ...f, allocationPercentage: percentage } : f));
    onUpdateFunds(updated);
  };
  const handleRemoveFund = (fundId: string) => {
    const remaining = funds.filter((f) => f.fundId !== fundId);
    onUpdateFunds(remaining);
  };
  const handleAddFund = (newFund: { fundId: string; schemeName: string }) => {
    if (funds.length >= maxFunds) return;
    if (funds.some((f) => f.fundId === newFund.fundId)) return;
    const remainingPercentage = Math.max(0, 100 - totalAllocation);
    const added: SelectedFundAllocation = {
      fundId: newFund.fundId,
      schemeName: newFund.schemeName,
      allocationPercentage: remainingPercentage > 0 ? remainingPercentage : 25,
      fundType: newFund.schemeName.toLowerCase().includes('bond') || newFund.schemeName.toLowerCase().includes('debt') ? 'debt' : 'equity',
      expectedCagr: 12,
    };
    onUpdateFunds([...funds, added]);
  };
  const handleAutoBalance = () => {
    if (funds.length === 0) return;
    const equalShare = Math.floor(100 / funds.length);
    const remainder = 100 - equalShare * funds.length;
    const balanced = funds.map((f, i) => ({
      ...f,
      allocationPercentage: equalShare + (i === 0 ? remainder : 0),
    }));
    onUpdateFunds(balanced);
  };
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>02</div>
        <div className={styles.stageTitleGroup}>
          <div className={styles.fundHeaderTitleRow}>
            <h3 className={styles.stageTitle}>Mutual Fund Selection</h3>
            <span className={`${styles.allocValidationBadge} ${isValid100 ? styles.validBadge : styles.invalidBadge}`}>
              <FiPieChart />
              <span>Total: {totalAllocation}% {isValid100 ? '(Valid)' : `(Need ${100 - totalAllocation > 0 ? '+' : ''}${100 - totalAllocation}%)`}</span>
            </span>
          </div>
          <span className={styles.stageSubtitle}>
            Select up to {maxFunds} funds &amp; configure percentage splits (Must sum to 100%)
          </span>
        </div>
      </div>
      <div className={styles.fundsList}>
        {funds.map((fund, idx) => (
          <div key={fund.fundId} className={styles.fundItemCard}>
            <div className={styles.fundItemHeader}>
              <span className={styles.fundIndexDot} data-fund-index={idx % 4} />
              <div className={styles.fundTitleWrap}>
                <span className={styles.fundItemName}>{fund.schemeName || `Fund #${fund.fundId}`}</span>
                <span className={fund.fundType === 'debt' ? styles.tagDebt : styles.tagEquity}>
                  {(fund.fundType || 'equity').toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                className={styles.removeFundBtn}
                onClick={() => handleRemoveFund(fund.fundId)}
                title="Remove fund"
              >
                <FiTrash2 />
              </button>
            </div>
            <div className={styles.fundAllocInputRow}>
              <label htmlFor={`alloc-${fund.fundId}`} className={styles.allocLabel}>
                Portfolio Split:
              </label>
              <div className={styles.inputWithUnit}>
                <input
                  id={`alloc-${fund.fundId}`}
                  type="number"
                  className={styles.allocNumberInput}
                  value={fund.allocationPercentage}
                  onChange={(e) => handleAllocationChange(fund.fundId, parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="1"
                />
                <span className={styles.unitSuffix}>%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!isValid100 && funds.length > 0 && (
        <button
          type="button"
          className={styles.autoBalanceBtn}
          onClick={handleAutoBalance}
          title="Distribute 100% equally across selected funds"
        >
          <FiRefreshCw />
          <span>Auto-Balance to 100%</span>
        </button>
      )}
      {funds.length < maxFunds && (
        <FundSearchDropdown onSelect={handleAddFund} disabled={funds.length >= maxFunds} />
      )}
    </section>
  );
};
