'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { NavType } from '../types/types';
import { fetchMFWithMeta, MFMetaType } from '../data/api_data';
import styles from './MutualFundDetailModal.module.scss';
const Chart = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: '2rem', height: '2rem', borderRadius: '9999px', border: '3px solid rgba(110, 11, 117, 0.2)', borderTopColor: '#6e0b75', animation: 'spin 0.8s linear infinite' }} />
    </div>
  ),
});
export interface DetailedFundItem {
  schemeCode: string;
  schemeName: string;
  color: string;
  startNav?: NavType | number;
  endNav?: NavType | number;
  startDate?: string | null;
  endDate?: string | null;
  matureAmt: number;
  profitAmt: number;
  profit: number; // CAGR %
  absProfit: number; // Absolute %
  invAmt: number;
  navData?: NavType[];
}
interface MutualFundDetailModalProps {
  fund: DetailedFundItem | null;
  onClose: () => void;
}
const formatINR = (val: number): string =>
  `₹${Math.round(val).toLocaleString('en-IN')}`;
export default function MutualFundDetailModal({
  fund,
  onClose,
}: MutualFundDetailModalProps) {
  const [meta, setMeta] = useState<MFMetaType | null>(null);
  const [taxMode, setTaxMode] = useState<'auto' | 'ltcg' | 'stcg' | 'slab30' | 'none'>('auto');
  useEffect(() => {
    if (!fund?.schemeCode) return;
    let active = true;
    fetchMFWithMeta(fund.schemeCode)
      .then((res) => {
        if (active && res.meta) {
          setMeta(res.meta);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch MF metadata:', err);
      });
    return () => {
      active = false;
    };
  }, [fund?.schemeCode]);
  // Calculate holding period in days
  const holdingDays = useMemo(() => {
    if (!fund?.navData || fund.navData.length < 2) return 365;
    const startPoint = fund.navData[fund.navData.length - 1];
    const endPoint = fund.navData[0];
    if (!startPoint || !endPoint) return 365;
    const parseDate = (dStr: string) => {
      const p = dStr.split('-');
      if (p.length === 3) {
        return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
      }
      return 0;
    };
    const sTime = parseDate(startPoint.date);
    const eTime = parseDate(endPoint.date);
    return Math.max(1, Math.round(Math.abs(eTime - sTime) / (1000 * 60 * 60 * 24)));
  }, [fund?.navData]);
  const holdingYears = (holdingDays / 365.25).toFixed(2);
  const isLongTerm = holdingDays > 365;
  // Compute post-tax returns based on Indian Finance Act 2024 / Sec 112A
  const taxCalculations = useMemo(() => {
    if (!fund) return { taxAmount: 0, postTaxMaturity: 0, postTaxProfit: 0, postTaxCagr: 0, rateLabel: '' };
    const gains = Math.max(0, fund.profitAmt);
    let effectiveTax = 0;
    let rateLabel = '';
    const effectiveMode = taxMode === 'auto' ? (isLongTerm ? 'ltcg' : 'stcg') : taxMode;
    if (effectiveMode === 'none') {
      effectiveTax = 0;
      rateLabel = '0% (Exempt)';
    } else if (effectiveMode === 'ltcg') {
      // Equity LTCG (Budget 2024): ₹1.25L exemption, 12.5% + 4% cess = 13.0%
      const taxableGains = Math.max(0, gains - 125000);
      effectiveTax = taxableGains * 0.13;
      rateLabel = '12.5% LTCG (>₹1.25L exemption + 4% cess)';
    } else if (effectiveMode === 'stcg') {
      // Equity STCG (Budget 2024): 20% + 4% cess = 20.8%
      effectiveTax = gains * 0.208;
      rateLabel = '20% STCG (+ 4% cess)';
    } else if (effectiveMode === 'slab30') {
      // Debt / Non-equity slab rate (30% + 4% cess = 31.2%)
      effectiveTax = gains * 0.312;
      rateLabel = '30% Income Slab (+ 4% cess)';
    }
    const postTaxMaturity = fund.matureAmt - effectiveTax;
    const postTaxProfit = fund.profitAmt - effectiveTax;
    const yearsNum = Math.max(0.1, Number(holdingYears));
    const postTaxCagr =
      fund.invAmt > 0 && postTaxMaturity > 0
        ? (Math.pow(postTaxMaturity / fund.invAmt, 1 / yearsNum) - 1) * 100
        : 0;
    return {
      taxAmount: effectiveTax,
      postTaxMaturity,
      postTaxProfit,
      postTaxCagr,
      rateLabel,
    };
  }, [fund, taxMode, isLongTerm, holdingYears]);
  // Dedicated single-fund chart dataset
  const chartDatasets = useMemo(() => {
    if (!fund?.navData || fund.navData.length === 0) return [];
    return [
      {
        label: fund.schemeName,
        color: fund.color || '#2563eb',
        data: fund.navData.map((d) => ({
          date: d.date,
          nav: Number(d.nav),
        })),
      },
    ];
  }, [fund]);
  // Sectoral and constituent profile based on scheme category
  const constituentProfile = useMemo(() => {
    const cat = (meta?.scheme_category || fund?.schemeName || '').toLowerCase();
    if (cat.includes('elss') || cat.includes('tax saver')) {
      return {
        categoryType: 'Equity: Tax Saving (ELSS)',
        benchmark: 'NIFTY 500 TRI',
        topHoldings: 'HDFC Bank, ICICI Bank, Infosys, Reliance Industries, TCS, Larsen & Toubro, Bharti Airtel',
        sectors: 'Financial Services (31%), Technology (12%), Oil & Gas (9%), Capital Goods (8%), Auto (7%)',
      };
    }
    if (cat.includes('arbitrage')) {
      return {
        categoryType: 'Hybrid: Arbitrage (Equity Taxation)',
        benchmark: 'NIFTY 50 Arbitrage Index',
        topHoldings: 'Cash-Futures Equities (Fully Hedged), Sovereign T-Bills, AAA Short-term Corporate Bonds',
        sectors: 'Arbitrage Equities (68%), Debt & Money Market (28%), Cash & Collateral (4%)',
      };
    }
    if (cat.includes('small cap')) {
      return {
        categoryType: 'Equity: Small Cap Fund',
        benchmark: 'NIFTY Smallcap 250 TRI',
        topHoldings: 'High-growth emerging Indian enterprises across Capital Goods, Chemicals, Auto Ancillaries, and Digital Tech',
        sectors: 'Industrial Manufacturing (22%), Consumer Discretionary (16%), Financials (14%), Chemicals (11%)',
      };
    }
    if (cat.includes('mid cap')) {
      return {
        categoryType: 'Equity: Mid Cap Fund',
        benchmark: 'NIFTY Midcap 150 TRI',
        topHoldings: 'Market-leading mid-sized companies with proven compounding and robust balance sheets',
        sectors: 'Financials (20%), Auto & Auto Components (15%), Healthcare (12%), IT (10%)',
      };
    }
    if (cat.includes('flexi cap') || cat.includes('multi cap')) {
      return {
        categoryType: 'Equity: Dynamic Multi-Cap Allocation',
        benchmark: 'NIFTY 500 TRI',
        topHoldings: 'ICICI Bank, HDFC Bank, Infosys, Reliance, ITC, Tata Motors, L&T, Sun Pharma',
        sectors: 'Banking & Financials (28%), IT & Tech (14%), Healthcare (9%), Industrials (8%)',
      };
    }
    return {
      categoryType: meta?.scheme_category || 'Indian Mutual Fund Scheme',
      benchmark: 'Broad Market Composite TRI',
      topHoldings: 'Leading diversified holdings as per AMFI and SEBI investment mandates',
      sectors: 'Diversified across key growth sectors of the Indian economy',
    };
  }, [meta, fund]);
  if (!fund) return null;
  return (
    <div className={styles.dialogOverlay} role="dialog" aria-modal="true">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close modal"
        onClick={onClose}
      />
      <section className={styles.modalContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span
              className={styles.colorIndicator}
              style={{ backgroundColor: fund.color || '#2563eb' }}
            />
            <div className={styles.titleGroup}>
              <h2 className={styles.title}>{fund.schemeName}</h2>
              <div className={styles.metaTags}>
                {meta?.fund_house && (
                  <span className={`${styles.tag} ${styles.tagPrimary}`}>{meta.fund_house}</span>
                )}
                {meta?.scheme_category && (
                  <span className={styles.tag}>{meta.scheme_category}</span>
                )}
                <span className={styles.tag}>Code: {fund.schemeCode}</span>
                {meta?.isin_growth && (
                  <span className={styles.tag}>ISIN: {meta.isin_growth}</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        {/* Scrollable Body */}
        <div className={styles.modalBody}>
          {/* Key Return Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Invested Capital</span>
              <span className={styles.statValue}>{formatINR(fund.invAmt)}</span>
              <span className={styles.statSubtext}>
                NAV: ₹
                {typeof fund.startNav === 'object' && fund.startNav
                  ? parseFloat(fund.startNav.nav).toFixed(2)
                  : (Number(fund.startNav) || 0).toFixed(2)}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pre-Tax Maturity</span>
              <span className={styles.statValue}>{formatINR(fund.matureAmt)}</span>
              <span className={styles.statSubtext}>
                NAV: ₹
                {typeof fund.endNav === 'object' && fund.endNav
                  ? parseFloat(fund.endNav.nav).toFixed(2)
                  : (Number(fund.endNav) || 0).toFixed(2)}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Gross Capital Gain</span>
              <span className={`${styles.statValue} ${fund.profitAmt >= 0 ? styles.statGain : styles.statLoss}`}>
                {fund.profitAmt >= 0 ? '+' : ''}{formatINR(fund.profitAmt)}
              </span>
              <span className={styles.statSubtext}>{fund.absProfit.toFixed(1)}% Absolute</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Annualized CAGR</span>
              <span className={`${styles.statValue} ${fund.profit >= 0 ? styles.statGain : styles.statLoss}`}>
                {fund.profit.toFixed(2)}%
              </span>
              <span className={styles.statSubtext}>{holdingDays} Days (~{holdingYears} Yrs)</span>
            </div>
          </div>
          {/* Dedicated Interactive Chart */}
          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>
              <span>Historical NAV & Portfolio Trajectory</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                Drag horizontally to zoom section
              </span>
            </div>
            <div className={styles.chartWrapper}>
              <Chart
                className={styles.chart}
                datasets={chartDatasets}
                investmentAmount={fund.invAmt}
                dataMode="value"
                autoHeight={true}
                enableZoom={true}
                startDate={fund.startDate}
                endDate={fund.endDate}
              />
            </div>
          </div>
          {/* Post-Tax Returns Calculator */}
          <div className={styles.taxSection}>
            <div className={styles.taxHeader}>
              <h3 className={styles.taxTitle}>
                <span>🇮🇳 Actual Post-Tax In-Hand Returns (Finance Act 2024)</span>
              </h3>
              <div className={styles.taxToggles}>
                <button
                  type="button"
                  className={`${styles.taxToggleBtn} ${taxMode === 'auto' ? styles.activeToggle : ''}`}
                  onClick={() => setTaxMode('auto')}
                  title="Auto-detect based on holding period"
                >
                  Auto ({isLongTerm ? 'LTCG 12.5%' : 'STCG 20%'})
                </button>
                <button
                  type="button"
                  className={`${styles.taxToggleBtn} ${taxMode === 'ltcg' ? styles.activeToggle : ''}`}
                  onClick={() => setTaxMode('ltcg')}
                >
                  LTCG (12.5%)
                </button>
                <button
                  type="button"
                  className={`${styles.taxToggleBtn} ${taxMode === 'stcg' ? styles.activeToggle : ''}`}
                  onClick={() => setTaxMode('stcg')}
                >
                  STCG (20%)
                </button>
                <button
                  type="button"
                  className={`${styles.taxToggleBtn} ${taxMode === 'slab30' ? styles.activeToggle : ''}`}
                  onClick={() => setTaxMode('slab30')}
                >
                  Debt/Slab (30%)
                </button>
              </div>
            </div>
            <div className={styles.taxCardsGrid}>
              <div className={styles.taxCard}>
                <span className={styles.taxCardLabel}>Holding Period</span>
                <span className={styles.taxCardValue} style={{ fontSize: '1rem', color: '#0f172a' }}>
                  {holdingDays} Days ({holdingYears} Years)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Classification: <strong>{isLongTerm ? 'Long Term (>1 Yr)' : 'Short Term (≤1 Yr)'}</strong>
                </span>
              </div>
              <div className={styles.taxCard}>
                <span className={styles.taxCardLabel}>Estimated Tax Deducted</span>
                <span className={styles.taxCardValue} style={{ color: '#b91c1c' }}>
                  {formatINR(taxCalculations.taxAmount)}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Rate: {taxCalculations.rateLabel}
                </span>
              </div>
              <div className={styles.taxCard} style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                <span className={styles.taxCardLabel}>Actual Post-Tax In-Hand</span>
                <span className={styles.taxCardValue} style={{ color: '#15803d' }}>
                  {formatINR(taxCalculations.postTaxMaturity)}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>
                  Net Gain: +{formatINR(taxCalculations.postTaxProfit)}
                </span>
              </div>
              <div className={styles.taxCard} style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                <span className={styles.taxCardLabel}>Post-Tax Net CAGR</span>
                <span className={styles.taxCardValue} style={{ color: '#15803d' }}>
                  {taxCalculations.postTaxCagr.toFixed(2)}%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#166534' }}>
                  Gross CAGR: {fund.profit.toFixed(2)}%
                </span>
              </div>
            </div>
            <p className={styles.taxDisclaimer}>
              * Tax calculation follows Indian Budget 2024 provisions (Sections 112A & 111A). Long-Term Capital Gains on Equity are exempt up to ₹1,25,000 per financial year across all equity holdings, with the remainder taxed at 12.5% + 4% Health & Education Cess (effective 13.0%). Short-Term Capital Gains are taxed at 20% + 4% cess (effective 20.8%).
            </p>
          </div>
          {/* Scheme Overview, Category Benchmark & Constituents */}
          <div className={styles.infoSection}>
            <h3 className={styles.infoSectionTitle}>Scheme Portfolio & Structural Profile</h3>
            <div className={styles.infoDetailsGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Asset Management Company</span>
                <span className={styles.infoItemValue}>{meta?.fund_house || 'Registered Indian AMC'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Category Mandate</span>
                <span className={styles.infoItemValue}>{constituentProfile.categoryType}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Benchmark Index</span>
                <span className={styles.infoItemValue}>{constituentProfile.benchmark}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Scheme Structure</span>
                <span className={styles.infoItemValue}>{meta?.scheme_type || 'Open Ended Growth Scheme'}</span>
              </div>
            </div>
            <div className={styles.constituentsBox}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>
                Typical Core Holdings & Major Constituents:
              </div>
              <div style={{ marginBottom: 6 }}>{constituentProfile.topHoldings}</div>
              <div style={{ fontWeight: 700, marginBottom: 2, color: '#0f172a' }}>
                Representative Sector Exposure:
              </div>
              <div>{constituentProfile.sectors}</div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
