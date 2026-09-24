'use client';
import { useState, useEffect, useCallback } from 'react';
import type { DetailedFundItem } from '../components/MutualFundDetailModal';
import SEOHead from '../components/SEOHead';
import type { MutualFundSelection } from '../components/mutual-fund/types';
import { useFundSearch } from '../components/mutual-fund/useFundSearch';
import { usePinnedFunds } from '../components/mutual-fund/usePinnedFunds';
import { useMutualFundDates } from '../components/mutual-fund/useMutualFundDates';
import { getChartSeriesColor } from '../data/chartColors';
import { SipControls } from './sip/SipControls';
import { SipChartCol } from './sip/SipChartCol';
import { SipGrid } from './sip/SipGrid';
import { SipModals } from './sip/SipModals';
import { SipContent } from './sip/SipContent';
import { useSipAnalysis } from './sip/useSipAnalysis';
import { useSipStorage } from './sip/useSipStorage';
import type { SipSavedState, SipFundAnalysis } from './sip/types';
import { liveSipSchema } from '../data/seo/sipData';
import styles from './MutualFundAnalytics.module.scss';
export interface SipProps {
  showDate?: boolean;
  onSelectionChange?: (selection: MutualFundSelection) => void;
}
const SIP = ({ onSelectionChange }: SipProps) => {
  const [monthlyAmount, setMonthlyAmount] = useState('100000');
  const [dayOfMonth, setDayOfMonth] = useState('3');
  const [investmentStepUp, setInvestmentStepUp] = useState('0');
  const [viewChart, setViewChart] = useState(true);
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const [detailModalFund, setDetailModalFund] = useState<DetailedFundItem | null>(null);
  const dates = useMutualFundDates(null, null, '740', false);
  const pinned = usePinnedFunds([], dates.endDate, dates.duration, (s, e) => { dates.setStartDate(s); dates.setEndDate(e); });
  const search = useFundSearch('Kotak Arbitrage Fund', isFundSelectorOpen);
  const handleRestore = useCallback((saved: SipSavedState) => {
    search.setSearchKey(saved.searchKey);
    search.setSelectedType(saved.selectedType);
    search.setSelectedGrowth(saved.selectedGrowth);
    pinned.setSelectedCode(saved.selectedCode);
    dates.setDuration(saved.duration);
    dates.setShowDate(saved.showDate);
    setMonthlyAmount(saved.monthlyAmount);
    setDayOfMonth(saved.dayOfMonth);
    setInvestmentStepUp(saved.investmentStepUp);
    setViewChart(saved.viewChart);
    if (saved.pinnedFunds.length > 0) {
      pinned.setPinnedFunds(saved.pinnedFunds.map((f, i) => ({ ...f, color: getChartSeriesColor(i) })));
    }
    if (saved.startDate) dates.setStartDate(saved.startDate);
    if (saved.endDate) dates.setEndDate(saved.endDate);
  }, [dates, pinned, search]);
  const currentState: SipSavedState = {
    searchKey: search.searchKey, selectedType: search.selectedType, selectedGrowth: search.selectedGrowth,
    selectedCode: pinned.selectedCode, duration: dates.duration, monthlyAmount, showDate: dates.showDate,
    viewChart, pinnedFunds: pinned.pinnedFunds.slice(0, 8).map(({ schemeCode, schemeName }) => ({ schemeCode, schemeName })),
    startDate: dates.startDate, endDate: dates.endDate, dayOfMonth, investmentStepUp,
  };
  useSipStorage(currentState, handleRestore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { dates.alignInitialDates(pinned.jsonNavData); }, [pinned.jsonNavData]);
  useEffect(() => {
    onSelectionChange?.({ funds: pinned.pinnedFunds, navData: pinned.pinnedNavData, startDate: dates.startDate, endDate: dates.endDate });
  }, [onSelectionChange, pinned.pinnedFunds, pinned.pinnedNavData, dates.startDate, dates.endDate]);
  const { fundAnalyses, chartDatasets } = useSipAnalysis(
    pinned.pinnedFunds, pinned.pinnedNavData, dates.startDate, dates.endDate,
    monthlyAmount, investmentStepUp, dayOfMonth, viewChart
  );
  const handleSelectFund = useCallback((fund: SipFundAnalysis) => {
    setDetailModalFund({
      ...fund, invAmt: parseFloat(monthlyAmount) || 0,
      startDate: dates.startDate, endDate: dates.endDate, navData: pinned.pinnedNavData[fund.schemeCode] || [],
    });
  }, [dates.startDate, dates.endDate, monthlyAmount, pinned.pinnedNavData]);
  if (search.error.status === 'error' && search.deferredSearchKey.trim()) {
    return <h3 className={styles.statErrorBanner}>{search.error.message}</h3>;
  }
  return (
    <main className={styles.container}>
      <SEOHead
        title="Mutual Fund SIP Backtest — XIRR & Historical NAV Calculator India 2026"
        description="Backtest historical mutual fund SIP performance, XIRR returns, units accumulation, and rupee cost averaging on live AMFI data."
        keywords="mutual fund SIP calculator, mutual fund return calculator, SIP XIRR calculator, AMFI NAV history, step up SIP backtest, XIRR calculator, SIP backtest calculator"
        canonicalPath="/mutual-funds/sip"
        schema={liveSipSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>AMFI Live Feed &bull; True XIRR Backtesting</div>
        <h1 className={styles.title}>Mutual Fund SIP Historical Backtest &amp; XIRR Calculator</h1>
        <p className={styles.subtitle}>
          Simulate actual historical SIP returns, average purchase price, unit accumulation, and internal rate of return (XIRR).
        </p>
      </header>
      <div className={`${styles.analyticsGrid} ${styles.lumpsumAnalyticsGrid}`}>
        <SipControls
          pinnedCount={pinned.pinnedFunds.length}
          showDate={dates.showDate}
          viewChart={viewChart}
          duration={dates.duration}
          monthlyAmount={monthlyAmount}
          dayOfMonth={dayOfMonth}
          investmentStepUp={investmentStepUp}
          jsonNavData={pinned.jsonNavData}
          startDate={dates.startDate}
          endDate={dates.endDate}
          onOpenSelector={() => setIsFundSelectorOpen(true)}
          onToggleDate={dates.toggleShowDate}
          onToggleChart={() => setViewChart((prev) => !prev)}
          onDurationChange={(val) => dates.handleDurationChange(val, pinned.jsonNavData)}
          onMonthlyAmountChange={setMonthlyAmount}
          onDayOfMonthChange={setDayOfMonth}
          onStepUpChange={setInvestmentStepUp}
          onStartDateChange={dates.handleStartDateChange}
          onEndDateChange={dates.handleEndDateChange}
        />
        <SipChartCol
          viewChart={viewChart}
          pinnedCount={pinned.pinnedFunds.length}
          chartDatasets={chartDatasets}
          monthlyAmount={monthlyAmount}
          startDate={dates.startDate}
          endDate={dates.endDate}
          isNavLoading={pinned.isNavLoading}
        />
      </div>
      <SipGrid
        pinnedCount={pinned.pinnedFunds.length}
        fundAnalyses={fundAnalyses}
        onSelectFund={handleSelectFund}
        onOpenSelector={() => setIsFundSelectorOpen(true)}
      />
      <SipModals
        detailModalFund={detailModalFund}
        onCloseDetail={() => setDetailModalFund(null)}
        isFundSelectorOpen={isFundSelectorOpen}
        onCloseSelector={() => setIsFundSelectorOpen(false)}
        search={search}
        pinned={pinned}
      />
      <SipContent />
    </main>
  );
};
export default SIP;
