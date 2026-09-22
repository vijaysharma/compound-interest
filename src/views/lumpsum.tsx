'use client';
import { useState, useEffect, useCallback } from 'react';
import type { DetailedFundItem } from '../components/MutualFundDetailModal';
import SEOHead from '../components/SEOHead';
import type { MutualFundSelection, LumpsumSavedState, FundAnalysis } from '../components/mutual-fund/types';
import { useFundSearch } from '../components/mutual-fund/useFundSearch';
import { usePinnedFunds } from '../components/mutual-fund/usePinnedFunds';
import { useMutualFundDates } from '../components/mutual-fund/useMutualFundDates';
import { LumpsumControls } from './lumpsum/LumpsumControls';
import { LumpsumChartCol } from './lumpsum/LumpsumChartCol';
import { LumpsumGrid } from './lumpsum/LumpsumGrid';
import { LumpsumModals } from './lumpsum/LumpsumModals';
import { LumpsumContent } from './lumpsum/LumpsumContent';
import { useLumpsumAnalysis } from './lumpsum/useLumpsumAnalysis';
import { useLumpsumStorage } from './lumpsum/useLumpsumStorage';
import { lumpsumSchema } from '../data/seo/lumpsumData';
import styles from './MutualFundAnalytics.module.scss';
export interface LumpsumProps {
  showDate?: boolean;
  onSelectionChange?: (selection: MutualFundSelection) => void;
}
const Lumpsum = ({ onSelectionChange }: LumpsumProps) => {
  const [invAmt, setInvAmt] = useState('100000');
  const [viewChart, setViewChart] = useState(true);
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const [detailModalFund, setDetailModalFund] = useState<DetailedFundItem | null>(null);
  const dates = useMutualFundDates();
  const pinned = usePinnedFunds([], dates.endDate, dates.duration, (s, e) => {
    dates.setStartDate(s);
    dates.setEndDate(e);
  });
  const search = useFundSearch('Kotak Arbitrage Fund', isFundSelectorOpen);
  const handleRestore = useCallback((saved: LumpsumSavedState) => {
    search.setSearchKey(saved.searchKey);
    search.setSelectedType(saved.selectedType);
    search.setSelectedGrowth(saved.selectedGrowth);
    pinned.setSelectedCode(saved.selectedCode);
    dates.setDuration(saved.duration);
    dates.setShowDate(saved.showDate);
    setInvAmt(saved.invAmt);
    setViewChart(saved.viewChart);
    if (saved.pinnedFunds.length > 0) pinned.setPinnedFunds(saved.pinnedFunds);
    if (saved.startDate) dates.setStartDate(saved.startDate);
    if (saved.endDate) dates.setEndDate(saved.endDate);
  }, [dates, pinned, search]);
  const currentState: LumpsumSavedState = {
    searchKey: search.searchKey, selectedType: search.selectedType, selectedGrowth: search.selectedGrowth,
    selectedCode: pinned.selectedCode, duration: dates.duration, invAmt, showDate: dates.showDate,
    viewChart, pinnedFunds: pinned.pinnedFunds.slice(0, 8), startDate: dates.startDate, endDate: dates.endDate,
  };
  useLumpsumStorage(currentState, handleRestore);
  // `dates` is a fresh object every render, so keeping it in the dependency list
  // re-ran this on every render. Aligning only when the NAV series changes is
  // both sufficient and what the guard inside alignInitialDates expects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { dates.alignInitialDates(pinned.jsonNavData); }, [pinned.jsonNavData]);
  useEffect(() => {
    onSelectionChange?.({ funds: pinned.pinnedFunds, navData: pinned.pinnedNavData, startDate: dates.startDate, endDate: dates.endDate });
  }, [onSelectionChange, pinned.pinnedFunds, pinned.pinnedNavData, dates.startDate, dates.endDate]);
  const { fundAnalyses, chartDatasets } = useLumpsumAnalysis(
    pinned.pinnedFunds, pinned.pinnedNavData, dates.startDate, dates.endDate, invAmt, viewChart
  );
  const handleSelectFund = useCallback((fund: FundAnalysis) => {
    setDetailModalFund({
      ...fund, invAmt: parseFloat(invAmt) || 0, startDate: dates.startDate, endDate: dates.endDate,
      navData: pinned.pinnedNavData[fund.schemeCode] || [],
    });
  }, [invAmt, dates.startDate, dates.endDate, pinned.pinnedNavData]);
  if (search.error.status === 'error' && search.deferredSearchKey.trim()) {
    return <h3 className={styles.statErrorBanner}>{search.error.message}</h3>;
  }
  return (
    <main className={styles.container}>
      <SEOHead
        title="Mutual Fund Calculator — Lumpsum Return & CAGR Calculator India 2026"
        description="Analyze historical mutual fund lumpsum returns, CAGR growth, and rolling NAV trajectories with live AMFI data. Compare up to 8 funds simultaneously."
        keywords="mutual fund return calculator, lumpsum mutual fund calculator, mutual fund CAGR calculator, AMFI NAV history, Indian mutual funds backtesting, ROI calculator, CAGR calculator, NAV calculator, investment calculator"
        canonicalPath="/mutual-funds/lumpsum"
        schema={lumpsumSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>AMFI Live Sync &bull; Multi-Fund Backtesting</div>
        <h1 className={styles.title}>Mutual Fund Lumpsum Return &amp; Historical NAV Engine</h1>
        <p className={styles.subtitle}>
          Backtest historical mutual fund CAGR, absolute capital gains, and comparative NAV performance across 8 schemes.
        </p>
      </header>
      <div className={`${styles.analyticsGrid} ${styles.lumpsumAnalyticsGrid}`}>
        <LumpsumControls
          pinnedCount={pinned.pinnedFunds.length}
          onOpenSelector={() => setIsFundSelectorOpen(true)}
          showDate={dates.showDate}
          onToggleShowDate={dates.toggleShowDate}
          viewChart={viewChart}
          onToggleViewChart={() => setViewChart((p) => !p)}
          duration={dates.duration}
          onDurationChange={(val) => dates.handleDurationChange(val, pinned.jsonNavData)}
          startDate={dates.startDate}
          endDate={dates.endDate}
          onStartDateChange={dates.handleStartDateChange}
          onEndDateChange={dates.handleEndDateChange}
          invAmt={invAmt}
          onInvAmtChange={setInvAmt}
        />
        <LumpsumChartCol
          viewChart={viewChart}
          pinnedCount={pinned.pinnedFunds.length}
          chartDatasets={chartDatasets}
          invAmt={invAmt}
          startDate={dates.startDate}
          endDate={dates.endDate}
          isNavLoading={pinned.isNavLoading}
        />
      </div>
      <LumpsumGrid fundAnalyses={fundAnalyses} pinnedCount={pinned.pinnedFunds.length} onSelectFund={handleSelectFund} onOpenSelector={() => setIsFundSelectorOpen(true)} />
      <LumpsumModals
        detailModalFund={detailModalFund}
        onCloseDetail={() => setDetailModalFund(null)}
        isFundSelectorOpen={isFundSelectorOpen}
        onCloseSelector={() => setIsFundSelectorOpen(false)}
        search={search}
        pinned={pinned}
      />
      <LumpsumContent />
    </main>
  );
};
export default Lumpsum;
