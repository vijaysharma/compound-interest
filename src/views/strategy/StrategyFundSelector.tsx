import React, { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { SelectedFund } from './types';
import styles from './StrategyCalculator.module.scss';
interface StrategyFundSelectorProps {
  funds: SelectedFund[];
  maxFunds: number;
  onUpdateFunds: (funds: SelectedFund[]) => void;
  title: string;
}
export const StrategyFundSelector: React.FC<StrategyFundSelectorProps> = ({
  funds,
  maxFunds,
  onUpdateFunds,
  title,
}) => {
  const [newFundName, setNewFundName] = useState('');
  const [newFundCagr, setNewFundCagr] = useState('12');
  const [newFundType, setNewFundType] = useState<'equity' | 'debt'>('equity');
  const handleRemove = (code: string) => {
    const updated = funds.filter((f) => f.schemeCode !== code);
    if (updated.length > 0) {
      const equalShare = Math.floor(100 / updated.length);
      const normalized = updated.map((f, i) => ({
        ...f,
        allocationPercent: i === 0 ? 100 - equalShare * (updated.length - 1) : equalShare,
      }));
      onUpdateFunds(normalized);
    } else {
      onUpdateFunds([]);
    }
  };
  const handleAdd = () => {
    if (!newFundName.trim() || funds.length >= maxFunds) return;
    const newFund: SelectedFund = {
      schemeCode: `custom-${Date.now()}`,
      schemeName: newFundName.trim(),
      allocationPercent: 0,
      expectedCagr: parseFloat(newFundCagr) || 12,
      fundType: newFundType,
    };
    const updated = [...funds, newFund];
    const equalShare = Math.floor(100 / updated.length);
    const normalized = updated.map((f, i) => ({
      ...f,
      allocationPercent: i === 0 ? 100 - equalShare * (updated.length - 1) : equalShare,
    }));
    onUpdateFunds(normalized);
    setNewFundName('');
  };
  return (
    <div className={styles.fundSelectorWrap}>
      <div className={styles.fundSelectorHeader}>
        <span className={styles.fundSelectorTitle}>{title}</span>
        <span className={styles.fundCounter}>{funds.length}/{maxFunds} Funds Selected</span>
      </div>
      <div className={styles.fundList}>
        {funds.map((f) => (
          <div key={f.schemeCode} className={styles.fundCard}>
            <div className={styles.fundMainInfo}>
              <span className={styles.fundName}>{f.schemeName}</span>
              <div className={styles.fundTags}>
                <span className={f.fundType === 'equity' ? styles.tagEquity : styles.tagDebt}>
                  {f.fundType.toUpperCase()}
                </span>
                <span className={styles.tagCagr}>{f.expectedCagr}% CAGR</span>
                <span className={styles.tagWeight}>{f.allocationPercent}% Weight</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.deleteFundBtn}
              onClick={() => handleRemove(f.schemeCode)}
              aria-label={`Remove ${f.schemeName}`}
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
      {funds.length < maxFunds && (
        <div className={styles.addFundForm}>
          <input
            type="text"
            className={styles.addFundInput}
            placeholder="Add fund name (e.g. Parag Parikh Flexi Cap)"
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
          />
          <input
            type="number"
            className={styles.addCagrInput}
            placeholder="CAGR %"
            value={newFundCagr}
            onChange={(e) => setNewFundCagr(e.target.value)}
          />
          <select
            className={styles.addTypeSelect}
            value={newFundType}
            onChange={(e) => setNewFundType(e.target.value as 'equity' | 'debt')}
          >
            <option value="equity">Equity</option>
            <option value="debt">Debt</option>
          </select>
          <button type="button" className={styles.addFundSubmitBtn} onClick={handleAdd}>
            <FiPlus /> Add
          </button>
        </div>
      )}
    </div>
  );
};
