import React from 'react';
import { Streamline, SelectedFund } from './types';
import { SelectedFundAllocation, SwpInterval } from './column1Types';
import { DEFAULT_SWP_INTERVALS } from './strategyPresets';
import { StreamlineManager } from './StreamlineManager';
import { LumpsumSection } from './LumpsumSection';
import { FundAllocationSection } from './FundAllocationSection';
import { SwpIntervalBuilder } from './SwpIntervalBuilder';
import { StepCTopUpsSection } from './StepCTopUpsSection';
import styles from './StrategyCalculator.module.scss';
interface Column1InputsProps {
  streamlines: Streamline[];
  activeId: string;
  activeStreamline: Streamline;
  onSelectStreamline: (id: string) => void;
  onUpdateActive: (updater: Partial<Streamline>) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  isSaved: boolean;
}
export const Column1Inputs: React.FC<Column1InputsProps> = ({
  streamlines,
  activeId,
  activeStreamline,
  onSelectStreamline,
  onUpdateActive,
  onSave,
  onDuplicate,
  onAdd,
  onDelete,
  isSaved,
}) => {
  const fundsAllocation: SelectedFundAllocation[] = activeStreamline.sourceFunds.map((f) => ({
    fundId: f.schemeCode,
    schemeName: f.schemeName,
    allocationPercentage: f.allocationPercent,
    fundType: f.fundType,
    expectedCagr: f.expectedCagr,
  }));
  const handleUpdateFundAllocations = (updated: SelectedFundAllocation[]) => {
    const sourceFunds: SelectedFund[] = updated.map((f) => ({
      schemeCode: f.fundId,
      schemeName: f.schemeName || `Fund ${f.fundId}`,
      allocationPercent: f.allocationPercentage,
      expectedCagr: f.expectedCagr || 12,
      fundType: f.fundType || 'equity',
    }));
    onUpdateActive({ sourceFunds });
  };
  const currentIntervals: SwpInterval[] =
    activeStreamline.swpIntervals && activeStreamline.swpIntervals.length > 0
      ? activeStreamline.swpIntervals
      : DEFAULT_SWP_INTERVALS;
  const currentSwpStart = activeStreamline.swpStartDate || activeStreamline.swpConfig.startDate || '2025-01-01';
  const currentSwpEnd = activeStreamline.swpEndDate || '2034-01-01';
  const handleUpdateIntervals = (swpIntervals: SwpInterval[]) => {
    const first = swpIntervals[0];
    onUpdateActive({
      swpIntervals,
      swpConfig: {
        ...activeStreamline.swpConfig,
        startDate: first?.fromDate || activeStreamline.swpConfig.startDate,
        baseAmount: first?.amount || activeStreamline.swpConfig.baseAmount,
        hasChange: swpIntervals.length > 1,
        changeDate: swpIntervals[1]?.fromDate || activeStreamline.swpConfig.changeDate,
        changeType: swpIntervals[1]?.stepUpType || 'percentage',
        changeValue: swpIntervals[1]?.stepUpValue || 10,
      },
    });
  };
  const handleAddTopUp = (date: string, amount: number, note?: string) => {
    onUpdateActive({ topUps: [...activeStreamline.topUps, { id: `tu-${Date.now()}`, date, amount, note }] });
  };
  const handleRemoveTopUp = (id: string) => {
    onUpdateActive({ topUps: activeStreamline.topUps.filter((t) => t.id !== id) });
  };
  return (
    <div className={styles.column1Container}>
      <div className={styles.columnHeader}>
        <span className={styles.columnBadge}>Column 1</span>
        <h2 className={styles.columnTitle}>Strategy Inputs &amp; Controls</h2>
        <p className={styles.columnSubtitle}>Lumpsum portfolio allocation &amp; variable SWP configurator</p>
      </div>
      <StreamlineManager
        streamlines={streamlines}
        activeId={activeId}
        onSelectStreamline={onSelectStreamline}
        onUpdateName={(name) => onUpdateActive({ name })}
        onSave={onSave}
        onDuplicate={onDuplicate}
        onAdd={onAdd}
        onDelete={onDelete}
        isSaved={isSaved}
      />
      <div className={styles.column1Scrollable}>
        <LumpsumSection
          investmentDate={activeStreamline.investmentDate}
          onInvestmentDateChange={(investmentDate) => onUpdateActive({ investmentDate })}
          investmentAmount={parseFloat(activeStreamline.investmentAmount) || 0}
          onInvestmentAmountChange={(amt) => onUpdateActive({ investmentAmount: String(amt) })}
        />
        <FundAllocationSection
          funds={fundsAllocation}
          onUpdateFunds={handleUpdateFundAllocations}
          maxFunds={4}
        />
        <SwpIntervalBuilder
          swpStartDate={currentSwpStart}
          onSwpStartDateChange={(swpStartDate) => onUpdateActive({ swpStartDate })}
          swpEndDate={currentSwpEnd}
          onSwpEndDateChange={(swpEndDate) => onUpdateActive({ swpEndDate })}
          intervals={currentIntervals}
          onUpdateIntervals={handleUpdateIntervals}
        />
        <StepCTopUpsSection
          topUps={activeStreamline.topUps}
          onAddTopUp={handleAddTopUp}
          onRemoveTopUp={handleRemoveTopUp}
          durationYears={activeStreamline.durationYears}
          onDurationChange={(durationYears) => onUpdateActive({ durationYears })}
        />
      </div>
    </div>
  );
};
