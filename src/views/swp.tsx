'use client';
import { useEffect, useCallback } from 'react';
import SEOHead from '../components/SEOHead';
import { useFundSearch } from '../components/mutual-fund/useFundSearch';
import { usePinnedFunds } from '../components/mutual-fund/usePinnedFunds';
import { SwpControls } from './swp/SwpControls';
import { SwpChartCol } from './swp/SwpChartCol';
import { SwpGrid } from './swp/SwpGrid';
import { SwpModals } from './swp/SwpModals';
import { SwpHeader } from './swp/SwpHeader';
import { SwpContent } from './swp/SwpContent';
import { useSwpAnalysis } from './swp/useSwpAnalysis';
import { useSwpStorage } from './swp/useSwpStorage';
import { useSwpState } from './swp/useSwpState';
import type { SwpSavedState, SwpFundAnalysis, SwpProps, SwpSelection } from './swp/types';
import { swpSchema } from '../data/seo/swpData';
import styles from './MutualFundAnalytics.module.scss';
export type { SwpProps, SwpSelection };
const SWP = ({ onSelectionChange }: SwpProps) => {
  const swp = useSwpState();
  const pinned = usePinnedFunds([], swp.endSwpDate);
  const search = useFundSearch('Kotak Arbitrage Fund', swp.isFundSelectorOpen);
  const handleRestore = useCallback(
    (savedState: SwpSavedState) => {
      swp.getRestoreHandler(pinned, search)(savedState);
    },
    [swp, pinned, search]
  );
  const currentState = swp.getCurrentState(pinned, search);
  useSwpStorage(currentState, handleRestore);
  useEffect(() => {
    onSelectionChange?.({
      funds: pinned.pinnedFunds,
      navData: pinned.pinnedNavData,
      startSwpDate: swp.startSwpDate,
      endSwpDate: swp.endSwpDate,
    });
  }, [onSelectionChange, pinned.pinnedFunds, pinned.pinnedNavData, swp.startSwpDate, swp.endSwpDate]);
  const { fundAnalyses, chartDatasets } = useSwpAnalysis(
    pinned.pinnedFunds,
    pinned.pinnedNavData,
    swp.lumpsumStartDate,
    swp.startSwpDate,
    swp.endSwpDate,
    swp.lumpSumInvestmentAmount,
    swp.monthlyWithdrawalAmount,
    swp.investmentStepUp,
    swp.dayOfMonth,
    swp.viewChart
  );
  const handleSelectFund = useCallback(
    (fund: SwpFundAnalysis) => {
      swp.setDetailModalFund({
        ...fund,
        invAmt: parseFloat(swp.lumpSumInvestmentAmount) || 0,
        startDate: swp.lumpsumStartDate || swp.startSwpDate,
        endDate: swp.endSwpDate,
        navData: pinned.pinnedNavData[fund.schemeCode] || [],
      });
    },
    [swp, pinned.pinnedNavData]
  );
  if (search.error.status === 'error' && search.deferredSearchKey.trim()) {
    return <h3 className={styles.statErrorBanner}>{search.error.message}</h3>;
  }
  return (
    <main className={styles.container}>
      <SEOHead
        title="Mutual Fund SWP Backtest — Retirement Withdrawal Calculator India 2026"
        description="Backtest historical mutual fund SWP cashflows, capital longevity, monthly retirement pension drawdowns, and portfolio yields with verified AMFI daily NAVs."
        keywords="mutual fund SWP calculator, SWP backtest calculator, retirement SWP planner, AMFI NAV history, systematic withdrawal plan India, retirement pension calculator, mutual fund withdrawal planner"
        canonicalPath="/mutual-funds/swp"
        schema={swpSchema}
      />
      <SwpHeader />
      <div className={`${styles.analyticsGrid} ${styles.lumpsumAnalyticsGrid}`}>
        <SwpControls
          pinnedCount={pinned.pinnedFunds.length}
          viewChart={swp.viewChart}
          lumpsumStartDate={swp.lumpsumStartDate}
          lumpSumInvestmentAmount={swp.lumpSumInvestmentAmount}
          startSwpDate={swp.startSwpDate}
          endSwpDate={swp.endSwpDate}
          monthlyWithdrawalAmount={swp.monthlyWithdrawalAmount}
          dayOfMonth={swp.dayOfMonth}
          investmentStepUp={swp.investmentStepUp}
          jsonNavData={pinned.jsonNavData}
          onOpenSelector={() => swp.setIsFundSelectorOpen(true)}
          onToggleChart={() => swp.setViewChart((prev) => !prev)}
          onLumpsumStartDateChange={swp.setLumpsumStartDate}
          onLumpSumInvestmentAmountChange={swp.setLumpSumInvestmentAmount}
          onStartSwpDateChange={swp.handleStartSwpDateChange}
          onEndSwpDateChange={swp.handleEndSwpDateChange}
          onMonthlyWithdrawalAmountChange={swp.setMonthlyWithdrawalAmount}
          onDayOfMonthChange={swp.setDayOfMonth}
          onStepUpChange={swp.setInvestmentStepUp}
        />
        <SwpChartCol
          viewChart={swp.viewChart}
          pinnedCount={pinned.pinnedFunds.length}
          chartDatasets={chartDatasets}
          monthlyWithdrawalAmount={swp.monthlyWithdrawalAmount}
          startDate={swp.lumpsumStartDate || swp.startSwpDate}
          endDate={swp.endSwpDate}
          isNavLoading={pinned.isNavLoading}
        />
      </div>
      <SwpGrid
        pinnedCount={pinned.pinnedFunds.length}
        fundAnalyses={fundAnalyses}
        onSelectFund={handleSelectFund}
        onOpenSelector={() => swp.setIsFundSelectorOpen(true)}
      />
      <SwpModals
        detailModalFund={swp.detailModalFund}
        onCloseDetail={() => swp.setDetailModalFund(null)}
        isFundSelectorOpen={swp.isFundSelectorOpen}
        onCloseSelector={() => swp.setIsFundSelectorOpen(false)}
        search={search}
        pinned={pinned}
      />
      <SwpContent />
    </main>
  );
};
export default SWP;
