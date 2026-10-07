'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  FiTrendingUp,
  FiInfo,
  FiAlertTriangle,
  FiArrowUpRight,
  FiPlusCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { MutualFundSelectorPanel } from '../../components/mutual-fund-selector/MutualFundSelectorPanel';
import { useFundSearch } from '../../components/mutual-fund/useFundSearch';
import { getCurrencySymbol } from '../../utilities/currency';
import { fetchMFWithMeta } from '../../data/api_data';
import type { NavType, MFType } from '../../types/types';
import type { PPFCalculationResult, PpfInvestmentRecord } from '../../utilities/ppfCalculations';
import {
  calculateMfComparison,
  findPreInceptionDeposits,
  type MfComparisonResult,
} from '../../utilities/ppfMutualFundComparison';
import styles from './PpfHistoryModal.module.scss';
interface BenchmarkFund {
  code: string;
  name: string;
  label: string;
}
const BENCHMARK_FUNDS: BenchmarkFund[] = [
  {
    code: '120716',
    name: 'UTI Nifty 50 Index Fund - Direct Plan - Growth',
    label: 'Nifty 50 Index',
  },
  {
    code: '122639',
    name: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    label: 'Parag Parikh Flexi Cap',
  },
  {
    // 118989 is HDFC Mid Cap; 119018 is HDFC Large Cap (formerly Top 100), per AMFI.
    code: '119018',
    name: 'HDFC Large Cap Fund - Direct Plan - Growth Option',
    label: 'HDFC Large Cap',
  },
];
interface PpfMutualFundComparisonProps {
  investments: PpfInvestmentRecord[];
  ppfResult: PPFCalculationResult;
  onSwitchToPassbook: () => void;
  importInvestments: (
    entries: Array<{ investmentDate: string; amount: number; notes?: string }>
  ) => Promise<void>;
}
export const PpfMutualFundComparison: React.FC<PpfMutualFundComparisonProps> = ({
  investments,
  ppfResult,
  onSwitchToPassbook,
  importInvestments,
}) => {
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  // Selected Fund State
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<string>(BENCHMARK_FUNDS[0].code);
  const [selectedSchemeName, setSelectedSchemeName] = useState<string>(BENCHMARK_FUNDS[0].name);
  // NAV & Fund Metadata
  const [navData, setNavData] = useState<NavType[]>([]);
  const [fundCategory, setFundCategory] = useState<string>('');
  const [isLoadingNav, setIsLoadingNav] = useState<boolean>(false);
  const [navError, setNavError] = useState<string | null>(null);
  // Fetch NAV data whenever selected fund changes
  useEffect(() => {
    if (!selectedSchemeCode) return;
    let isCancelled = false;
    setIsLoadingNav(true);
    setNavError(null);
    fetchMFWithMeta(selectedSchemeCode)
      .then((res) => {
        if (isCancelled) return;
        setNavData(res.data);
        if (res.meta?.scheme_category) {
          setFundCategory(res.meta.scheme_category);
        } else if (res.meta?.scheme_type) {
          setFundCategory(res.meta.scheme_type);
        }
        if (res.meta?.scheme_name) {
          setSelectedSchemeName(res.meta.scheme_name);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setNavError(err instanceof Error ? err.message : 'Failed to fetch mutual fund NAV data');
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingNav(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedSchemeCode]);
  // Mutual Fund Selector Modal State
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const fundSearch = useFundSearch(selectedSchemeName, isSelectorOpen);
  const pinnedFunds = useMemo(
    () => [
      {
        schemeCode: selectedSchemeCode,
        schemeName: selectedSchemeName,
        color: 'var(--color-primary)',
      },
    ],
    [selectedSchemeCode, selectedSchemeName]
  );
  const handleTogglePinFund = (fund: MFType) => {
    setSelectedSchemeCode(String(fund.value));
    setSelectedSchemeName(fund.name);
    setIsSelectorOpen(false);
  };
  // Deposits older than the fund have no real NAV; the comparison is withheld until another fund is picked.
  const preInception = useMemo(
    () => (isLoadingNav ? null : findPreInceptionDeposits(investments, navData)),
    [investments, navData, isLoadingNav]
  );
  // Compute Comparison Results
  const comparisonResult: MfComparisonResult | null = useMemo(() => {
    return calculateMfComparison(
      investments,
      navData,
      ppfResult,
      selectedSchemeCode,
      selectedSchemeName
    );
  }, [investments, navData, ppfResult, selectedSchemeCode, selectedSchemeName]);
  const handleLoadSampleHistory = async () => {
    const currentYear = new Date().getFullYear();
    const sampleEntries = [
      { investmentDate: `${currentYear - 5}-04-04`, amount: 150000, notes: 'Sample Deposit 1' },
      { investmentDate: `${currentYear - 4}-04-03`, amount: 150000, notes: 'Sample Deposit 2' },
      { investmentDate: `${currentYear - 3}-04-05`, amount: 150000, notes: 'Sample Deposit 3' },
      { investmentDate: `${currentYear - 2}-04-02`, amount: 150000, notes: 'Sample Deposit 4' },
      { investmentDate: `${currentYear - 1}-04-04`, amount: 150000, notes: 'Sample Deposit 5' },
    ];
    await importInvestments(sampleEntries);
  };
  if (investments.length === 0) {
    return (
      <div className={styles.emptyStateContainer}>
        <FiTrendingUp style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} />
        <h3 className={styles.emptyStateTitle}>No Historical PPF Deposits Found</h3>
        <p className={styles.emptyStateDesc}>
          To calculate the real outcome if invested in mutual funds, please add your actual deposits
          with dates in the Passbook tab, or load a sample 5-year investment history to preview the
          comparison.
        </p>
        <div
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <button type="button" className={styles.emptyActionBtn} onClick={handleLoadSampleHistory}>
            <FiPlusCircle /> Load Sample 5-Year History (₹1.5L / yr)
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${styles.tabBtnActive}`}
            onClick={onSwitchToPassbook}
          >
            Go to Passbook &amp; Add Deposits
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.mfCompareContainer}>
      {/* Benchmark Fund Selector & Search Bar */}
      <div className={styles.selectorBar}>
        <div className={styles.selectorHeading}>Select Mutual Fund Benchmark</div>
        <div className={styles.benchmarkPills}>
          {BENCHMARK_FUNDS.map((fund) => {
            const isActive = selectedSchemeCode === fund.code;
            return (
              <button
                key={fund.code}
                type="button"
                className={`${styles.benchmarkPill} ${isActive ? styles.benchmarkPillActive : ''}`}
                onClick={() => {
                  setSelectedSchemeCode(fund.code);
                  setSelectedSchemeName(fund.name);
                }}
              >
                {isActive && <FiCheckCircle />}
                {fund.label}
              </button>
            );
          })}
          <button
            type="button"
            className={`${styles.benchmarkPill} ${isSelectorOpen ? styles.benchmarkPillActive : ''}`}
            aria-expanded={isSelectorOpen}
            onClick={() => setIsSelectorOpen((open) => !open)}
          >
            Select Other Mutual Funds
          </button>
        </div>
      </div>
      {/* Already inside the passbook dialog: search in place rather than stacking another modal. */}
      {isSelectorOpen && (
        <div className={styles.inlineFundSearch}>
          <div className={styles.inlineFundSearchHeader}>
            <span>Pick a fund to compare against</span>
            <button
              type="button"
              className={styles.inlineFundSearchClose}
              onClick={() => setIsSelectorOpen(false)}
            >
              Cancel
            </button>
          </div>
          <MutualFundSelectorPanel
            inline
            searchKey={fundSearch.searchKey}
            setSearchKey={fundSearch.setSearchKey}
            selectedType={fundSearch.selectedType}
            setSelectedType={fundSearch.setSelectedType}
            selectedGrowth={fundSearch.selectedGrowth}
            setSelectedGrowth={fundSearch.setSelectedGrowth}
            funds={fundSearch.mfs}
            pinnedFunds={pinnedFunds}
            togglePinFund={handleTogglePinFund}
          />
        </div>
      )}
      {/* Active Fund Header Card */}
      <div className={styles.activeFundBar}>
        <div className={styles.activeFundInfo}>
          <span className={styles.activeFundTitle}>{selectedSchemeName}</span>
          <span className={styles.activeFundCategory}>
            {fundCategory ? `${fundCategory} • ` : ''}Scheme Code: {selectedSchemeCode}
          </span>
        </div>
        {comparisonResult && (
          <div className={styles.activeFundNavBadge}>
            Latest NAV: {currencySymbol}
            {comparisonResult.latestNav.toFixed(2)} ({comparisonResult.latestNavDate})
          </div>
        )}
      </div>
      {isLoadingNav && (
        <div className={styles.loadingSpinner}>
          <FiTrendingUp className="spin" /> Loading official AMFI NAV history...
        </div>
      )}
      {navError && (
        <div className={styles.warningBanner}>
          <FiAlertTriangle /> {navError}
        </div>
      )}
      {preInception && (
        <div className={styles.preInceptionBlock} role="alert">
          <FiAlertTriangle className={styles.preInceptionIcon} aria-hidden="true" />
          <div>
            <p className={styles.preInceptionTitle}>
              Choose a different fund: your PPF investments started before this fund existed.
            </p>
            <p className={styles.preInceptionBody}>
              <strong>{selectedSchemeName}</strong> launched on{' '}
              <strong>{preInception.inceptionDate}</strong>, but your first deposit was on{' '}
              <strong>{preInception.firstDepositDate}</strong>. {preInception.count} of your deposits (
              {currencySymbol}
              {preInception.amount.toLocaleString('en-IN')}) have no real NAV, so no comparison is shown
              rather than one built on a substitute price. Pick one of the benchmarks above, or use Select Other
              Mutual Funds to choose one launched before {preInception.firstDepositDate}.
            </p>
          </div>
        </div>
      )}

      {comparisonResult && !preInception && (
        <>
          {/* Comparison Metrics Grid */}
          <div className={styles.outcomeMetricsGrid}>
            {/* PPF Outcome Card */}
            <div className={`${styles.metricCard} ${styles.metricCardPpf}`}>
              <div className={styles.metricCardTag}>PPF Guaranteed Outcome</div>
              <div className={styles.metricCardValue}>
                {currencySymbol}
                {comparisonResult.ppfCurrentValue.toLocaleString('en-IN')}
              </div>
              <div className={styles.metricSubtext}>
                Total Principal: {currencySymbol}
                {comparisonResult.totalInvested.toLocaleString('en-IN')}
              </div>
              <div className={`${styles.metricSubtext} ${styles.gainPositive}`}>
                Interest Earned: +{currencySymbol}
                {comparisonResult.ppfTotalGain.toLocaleString('en-IN')} (
                {comparisonResult.ppfGainPercent.toFixed(1)}%)
              </div>
              <div style={{ fontSize: '0.6875rem', opacity: 0.7, marginTop: '0.25rem' }}>
                Zero market volatility &bull; 100% Sovereign Backed
              </div>
            </div>
            {/* Mutual Fund Outcome Card */}
            <div className={`${styles.metricCard} ${styles.metricCardMf}`}>
              <div className={styles.metricCardTag}>Mutual Fund Real Outcome</div>
              <div className={styles.metricCardValue}>
                {currencySymbol}
                {Math.round(comparisonResult.mfCurrentValue).toLocaleString('en-IN')}
              </div>
              <div className={styles.metricSubtext}>
                Total Units Accumulated: {comparisonResult.totalUnits.toFixed(3)}
              </div>
              <div className={`${styles.metricSubtext} ${styles.gainPositive}`}>
                Capital Gain: +{currencySymbol}
                {Math.round(comparisonResult.mfTotalGain).toLocaleString('en-IN')} (
                {comparisonResult.mfGainPercent.toFixed(1)}%)
              </div>
              {comparisonResult.xirr !== undefined && (
                <div
                  className={styles.gainHighlight}
                  style={{ marginTop: '0.25rem', width: 'fit-content' }}
                >
                  XIRR: {(comparisonResult.xirr * 100).toFixed(2)}% p.a.
                </div>
              )}
            </div>
            {/* Difference / Wealth Alpha Card */}
            <div className={`${styles.metricCard} ${styles.metricCardDelta}`}>
              <div className={styles.metricCardTag}>Real Wealth Creation Delta</div>
              <div
                className={styles.metricCardValue}
                style={{
                  color:
                    comparisonResult.diffAmount >= 0
                      ? 'var(--color-success)'
                      : 'var(--color-error)',
                }}
              >
                {comparisonResult.diffAmount >= 0 ? '+' : ''}
                {currencySymbol}
                {Math.round(comparisonResult.diffAmount).toLocaleString('en-IN')}
              </div>
              <div className={styles.metricSubtext}>
                {comparisonResult.diffAmount >= 0 ? (
                  <span className={styles.gainPositive}>
                    <FiArrowUpRight /> {comparisonResult.diffPercent.toFixed(1)}% more wealth than
                    PPF
                  </span>
                ) : (
                  <span>
                    PPF outperformed by {Math.abs(comparisonResult.diffPercent).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className={styles.metricSubtext} style={{ fontWeight: 600 }}>
                Corpus Multiplier: {comparisonResult.wealthMultiplier.toFixed(2)}x PPF balance
              </div>
            </div>
          </div>
          {/* Tax and Risk Insight */}
          <div className={styles.insightBox}>
            <FiInfo className={styles.insightIcon} />
            <div>
              <strong>Tax &amp; Risk Perspective:</strong> PPF enjoys guaranteed Sovereign EEE
              status (100% tax-free at deposit, accrual, and maturity). Equity Mutual Funds carry
              market risk and are subject to 12.5% Long Term Capital Gains (LTCG) tax on annual
              gains exceeding ₹1.25 Lakh (Finance Act 2024). Over longer horizons (10–15+ years),
              equity compounding historically offsets tax differences with substantial wealth
              outperformance.
            </div>
          </div>
          {/* Detailed Ledger Breakdown Table */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', fontWeight: 700 }}>
              Deposit-by-Deposit Mutual Fund Allotment Ledger
            </h4>
            <div className={styles.comparisonTableWrapper}>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Deposit Date</th>
                    <th>Amount (₹)</th>
                    <th>NAV on Date</th>
                    <th>Units Allotted</th>
                    <th>Current Value (₹)</th>
                    <th>Absolute Gain (₹)</th>
                    <th>Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResult.outcomes.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.date}</strong>
                      </td>
                      <td>
                        {currencySymbol}
                        {row.amount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        {currencySymbol}
                        {row.nav.toFixed(2)}
                      </td>
                      <td>{row.units.toFixed(3)}</td>
                      <td>
                        <strong>
                          {currencySymbol}
                          {Math.round(row.currentValue).toLocaleString('en-IN')}
                        </strong>
                      </td>
                      <td className={row.absoluteGain >= 0 ? styles.gainPositive : ''}>
                        {row.absoluteGain >= 0 ? '+' : ''}
                        {currencySymbol}
                        {Math.round(row.absoluteGain).toLocaleString('en-IN')}
                      </td>
                      <td className={row.gainPercent >= 0 ? styles.gainPositive : ''}>
                        {row.gainPercent >= 0 ? '+' : ''}
                        {row.gainPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
