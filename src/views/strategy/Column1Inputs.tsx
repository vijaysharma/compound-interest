import React, { useMemo } from 'react';
import { Streamline } from './types';
import { SwpInterval, RecurringTopUpSource } from './column1Types';
import { DEFAULT_SWP_INTERVALS, DEFAULT_RECURRING_TOPUPS } from './strategyPresets';
import { createSingleFund, adaptSwpIntervals } from './column1Adapters';
import { useFundNavData } from './useFundNavData';
import { runRealNavSimulation } from './realNavStrategyEngine';
import { StreamlineManager } from './StreamlineManager';
import { LumpsumSection } from './LumpsumSection';
import { FundSelectorSingle } from './FundSelectorSingle';
import { SwpIntervalBuilder } from './SwpIntervalBuilder';
import { RecurringTopUpBuilder } from './RecurringTopUpBuilder';
import { Column1GrowthChart } from './Column1GrowthChart';
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
  const primaryFund = activeStreamline.sourceFunds[0] || {
    schemeCode: '119551',
    schemeName: 'HDFC Nifty 50 Index Fund',
    allocationPercent: 100,
    expectedCagr: 12.5,
    fundType: 'equity' as const,
  };
  const intervals: SwpInterval[] =
    activeStreamline.swpIntervals?.length ? activeStreamline.swpIntervals : DEFAULT_SWP_INTERVALS;
  const topUps: RecurringTopUpSource[] =
    activeStreamline.recurringTopUps?.length ? activeStreamline.recurringTopUps : DEFAULT_RECURRING_TOPUPS;
  const swpStart = activeStreamline.swpStartDate || activeStreamline.swpConfig.startDate || '2025-01-01';
  const swpEnd = activeStreamline.swpEndDate || '2034-01-01';
  const numAmount = parseFloat(activeStreamline.investmentAmount) || 0;
  const { navData, isLoading } = useFundNavData(primaryFund.schemeCode);
  const realResult = useMemo(() => {
    return runRealNavSimulation(activeStreamline.investmentDate, numAmount, intervals, topUps, navData);
  }, [activeStreamline.investmentDate, numAmount, intervals, topUps, navData]);
  const handleFundChange = (chosen: { fundId: string; schemeName: string; fundType?: 'equity' | 'debt'; expectedCagr?: number }) => {
    onUpdateActive({ sourceFunds: createSingleFund(chosen) });
  };
  const handleIntervalsChange = (swpIntervals: SwpInterval[]) => {
    onUpdateActive({ swpIntervals, swpConfig: adaptSwpIntervals(swpIntervals, activeStreamline.swpConfig) });
  };
  return (
    <div className={styles.column1Container}>
      <div className={styles.columnHeader}>
        <span className={styles.columnBadge}>Column 1</span>
        <h2 className={styles.columnTitle}>Strategy Inputs &amp; Controls</h2>
        <p className={styles.columnSubtitle}>Single-fund real NAV unit accounting &amp; multi-source cash infusions</p>
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
          investmentAmount={numAmount}
          onInvestmentAmountChange={(amt) => onUpdateActive({ investmentAmount: String(amt) })}
        />
        <FundSelectorSingle
          selectedFund={{
            fundId: primaryFund.schemeCode,
            schemeName: primaryFund.schemeName,
            fundType: primaryFund.fundType,
            expectedCagr: primaryFund.expectedCagr,
          }}
          onSelectFund={handleFundChange}
        />
        <SwpIntervalBuilder
          swpStartDate={swpStart}
          onSwpStartDateChange={(swpStartDate) => onUpdateActive({ swpStartDate })}
          swpEndDate={swpEnd}
          onSwpEndDateChange={(swpEndDate) => onUpdateActive({ swpEndDate })}
          intervals={intervals}
          onUpdateIntervals={handleIntervalsChange}
        />
        <RecurringTopUpBuilder
          sources={topUps}
          onUpdateSources={(recurringTopUps) => onUpdateActive({ recurringTopUps })}
          defaultStartDate={activeStreamline.investmentDate}
        />
        <Column1GrowthChart
          points={realResult.points}
          initialAmount={numAmount}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
