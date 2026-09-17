'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { NavType } from '../types/types';
import { fetchMFWithMeta, MFMetaType } from '../data/api_data';
import Spinner from './Spinner';
import { getNearest, isoDateToNavDate, navDateToISO } from '../utilities/utility';
import { getTodayISO } from '../utilities/dateGuards';
import styles from './MutualFundDetailModal.module.scss';
const Chart = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="lg" label="Loading interactive chart..." />
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
const parseDateParts = (dStr: string) => {
  const p = dStr.split('-');
  if (p.length === 3) {
    if (p[0].length === 4) {
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime();
    }
    return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
  }
  return 0;
};
export default function MutualFundDetailModal({
  fund,
  onClose,
}: MutualFundDetailModalProps) {
  const [meta, setMeta] = useState<MFMetaType | null>(null);
  const [investmentType, setInvestmentType] = useState<'lumpsum' | 'sip'>('lumpsum');
  const [taxMode, setTaxMode] = useState<'auto' | 'ltcg' | 'stcg' | 'slab30' | 'slab20' | 'none'>('auto');
  const [fetchedNavData, setFetchedNavData] = useState<NavType[]>([]);
  const navData = fund?.navData && fund.navData.length > 0 ? fund.navData : fetchedNavData;
  // Sorted date limits from navData
  const { minNavDateISO, maxNavDateISO } = useMemo(() => {
    if (!navData || navData.length === 0) {
      return { minNavDateISO: '', maxNavDateISO: '' };
    }
    const sorted = [...navData].sort(
      (a, b) => parseDateParts(a.date) - parseDateParts(b.date)
    );
    return {
      minNavDateISO: navDateToISO(sorted[0].date),
      maxNavDateISO: navDateToISO(sorted[sorted.length - 1].date),
    };
  }, [navData]);
  // Track schemeCode changes to avoid wiping state on parent re-renders
  const [prevSchemeCode, setPrevSchemeCode] = useState<string | undefined>(fund?.schemeCode);
  const [customStartDateISO, setCustomStartDateISO] = useState<string | null>(null);
  const [customEndDateISO, setCustomEndDateISO] = useState<string | null>(null);
  const [customInvestmentValue, setCustomInvestmentValue] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  if (fund?.schemeCode !== prevSchemeCode) {
    setPrevSchemeCode(fund?.schemeCode);
    setCustomStartDateISO(null);
    setCustomEndDateISO(null);
    setCustomInvestmentValue(null);
    setActivePreset(null);
    setFetchedNavData([]);
  }
  useEffect(() => {
    if (!fund?.schemeCode || typeof window === 'undefined') return;
    const handleRestore = () => {
      try {
        const raw = window.localStorage.getItem('mf_modal_state_' + fund.schemeCode);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.investmentType) setInvestmentType(parsed.investmentType);
          if (parsed.customInvestmentValue) setCustomInvestmentValue(parsed.customInvestmentValue);
          if (parsed.taxMode) setTaxMode(parsed.taxMode);
          if (parsed.customStartDateISO) setCustomStartDateISO(parsed.customStartDateISO);
          if (parsed.customEndDateISO) setCustomEndDateISO(parsed.customEndDateISO);
          if (parsed.activePreset) setActivePreset(parsed.activePreset);
        }
      } catch {
        // Ignore read errors
      }
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
  }, [fund?.schemeCode]);
  useEffect(() => {
    if (!fund?.schemeCode || typeof window === 'undefined') return;
    try {
      const state = {
        investmentType,
        customInvestmentValue,
        taxMode,
        customStartDateISO,
        customEndDateISO,
        activePreset,
      };
      window.localStorage.setItem('mf_modal_state_' + fund.schemeCode, JSON.stringify(state));
    } catch {
      // Ignore write errors
    }
  }, [fund?.schemeCode, investmentType, customInvestmentValue, taxMode, customStartDateISO, customEndDateISO, activePreset]);
  const startDateISO = customStartDateISO ?? (fund?.startDate ? navDateToISO(fund.startDate) : minNavDateISO);
  const endDateISO = customEndDateISO ?? (fund?.endDate ? navDateToISO(fund.endDate) : maxNavDateISO);
  const investmentValue = customInvestmentValue ?? String(fund && fund.invAmt > 0 ? fund.invAmt : 100000);
  const setStartDateISO = (val: string) => {
    const nextStart = val;
    let nextEnd = endDateISO;
    if (nextEnd && nextStart > nextEnd) {
      nextEnd = nextStart;
      setCustomEndDateISO(nextEnd);
    }
    setCustomStartDateISO(nextStart);
    setActivePreset(null);
  };
  const setEndDateISO = (val: string) => {
    const today = getTodayISO();
    const nextEnd = val > today ? today : val;
    let nextStart = startDateISO;
    if (nextStart && nextEnd < nextStart) {
      nextStart = nextEnd;
      setCustomStartDateISO(nextStart);
    }
    setCustomEndDateISO(nextEnd);
    setActivePreset(null);
  };
  const setInvestmentValue = (val: string) => setCustomInvestmentValue(val);
  const getPresetStartDateISO = (preset: string, maxDateISO: string, minDateISO: string): string => {
    if (preset === 'All' || !maxDateISO) return minDateISO;
    const end = new Date(maxDateISO);
    if (Number.isNaN(end.getTime())) return minDateISO;
    const target = new Date(end);
    switch (preset) {
      case '1M':
        target.setMonth(target.getMonth() - 1);
        break;
      case '6M':
        target.setMonth(target.getMonth() - 6);
        break;
      case '1Y':
        target.setFullYear(target.getFullYear() - 1);
        break;
      case '3Y':
        target.setFullYear(target.getFullYear() - 3);
        break;
      case '5Y':
        target.setFullYear(target.getFullYear() - 5);
        break;
      default:
        return minDateISO;
    }
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const computedISO = `${year}-${month}-${day}`;
    return computedISO < minDateISO ? minDateISO : computedISO;
  };
  const handleSelectPreset = (preset: string) => {
    if (!maxNavDateISO || !minNavDateISO) return;
    const newStart = getPresetStartDateISO(preset, maxNavDateISO, minNavDateISO);
    setCustomStartDateISO(newStart);
    setCustomEndDateISO(maxNavDateISO);
    setActivePreset(preset);
  };
  // Fetch MF metadata
  useEffect(() => {
    if (!fund?.schemeCode) return;
    let active = true;
    fetchMFWithMeta(fund.schemeCode)
      .then((res) => {
        if (active && res.meta) {
          setMeta(res.meta);
        }
        if (active && res.data && res.data.length > 0) {
          setFetchedNavData(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch MF metadata:', err);
      });
    return () => {
      active = false;
    };
  }, [fund?.schemeCode]);
  // Convert current ISO dates back to DD-MM-YYYY for calculation
  const currentNavStartDate = useMemo(
    () => (startDateISO ? isoDateToNavDate(startDateISO) : fund?.startDate || ''),
    [startDateISO, fund?.startDate]
  );
  const currentNavEndDate = useMemo(
    () => (endDateISO ? isoDateToNavDate(endDateISO) : fund?.endDate || ''),
    [endDateISO, fund?.endDate]
  );
  // Holding Period calculation
  const holdingDays = useMemo(() => {
    if (!startDateISO || !endDateISO) return 365;
    const sTime = new Date(startDateISO).getTime();
    const eTime = new Date(endDateISO).getTime();
    return Math.max(1, Math.round(Math.abs(eTime - sTime) / (1000 * 60 * 60 * 24)));
  }, [startDateISO, endDateISO]);
  const holdingYears = Math.max(0.08, Number((holdingDays / 365.25).toFixed(2)));
  const isLongTerm = holdingDays > 365;
  // Asset category determination for smart taxation
  const fundCategory = useMemo(() => {
    const text = `${meta?.scheme_category || ''} ${fund?.schemeName || ''}`.toLowerCase();
    if (
      text.includes('debt') ||
      text.includes('liquid') ||
      text.includes('money market') ||
      text.includes('overnight') ||
      text.includes('gilt') ||
      text.includes('corporate bond') ||
      text.includes('banking and psu') ||
      text.includes('floater')
    ) {
      return 'debt';
    }
    if (text.includes('conservative hybrid') || text.includes('equity savings')) {
      return 'hybrid_conservative';
    }
    return 'equity';
  }, [meta?.scheme_category, fund?.schemeName]);
  // Live Performance & Investment Calculation
  const performance = useMemo(() => {
    if (!navData || navData.length === 0) {
      return {
        invested: fund?.invAmt || 0,
        maturity: fund?.matureAmt || 0,
        gain: fund?.profitAmt || 0,
        absReturn: fund?.absProfit || 0,
        cagr: fund?.profit || 0,
        startNavVal: 0,
        endNavVal: 0,
        datasets: [],
      };
    }
    const startNavObj = getNearest(currentNavStartDate, navData);
    const endNavObj = getNearest(currentNavEndDate, navData);
    const sNav = startNavObj ? parseFloat(startNavObj.nav) : 10;
    const eNav = endNavObj ? parseFloat(endNavObj.nav) : sNav;
    const amountInput = Math.max(100, parseFloat(investmentValue) || 100000);
    if (investmentType === 'lumpsum') {
      const units = amountInput / sNav;
      const maturity = units * eNav;
      const gain = maturity - amountInput;
      const absReturn = (gain / amountInput) * 100;
      const cagr =
        amountInput > 0 && maturity > 0
          ? (Math.pow(maturity / amountInput, 1 / holdingYears) - 1) * 100
          : 0;
      const lowerT = Math.min(parseDateParts(currentNavStartDate), parseDateParts(currentNavEndDate));
      const upperT = Math.max(parseDateParts(currentNavStartDate), parseDateParts(currentNavEndDate));
      const points = navData
        .map((p) => ({
          date: p.date,
          nav: Number((units * parseFloat(p.nav)).toFixed(2)),
          time: parseDateParts(p.date),
        }))
        .filter((p) => p.time >= lowerT && p.time <= upperT)
        .sort((a, b) => a.time - b.time)
        .map(({ date, nav }) => ({ date, nav }));
      return {
        invested: amountInput,
        maturity,
        gain,
        absReturn,
        cagr,
        startNavVal: sNav,
        endNavVal: eNav,
        datasets: [
          {
            label: `${fund?.schemeName || 'Fund'} (Lumpsum)`,
            color: fund?.color || '#2563eb',
            data: points,
          },
        ],
      };
    }
    // Monthly SIP Simulation
    const monthlySip = amountInput;
    const sDate = new Date(startDateISO || minNavDateISO || '2020-01-01');
    const eDate = new Date(endDateISO || maxNavDateISO || '2024-01-01');
    const dayOfMonth = sDate.getDate();
    let totalUnits = 0;
    let installments = 0;
    const cur = new Date(sDate);
    while (cur <= eDate) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const day = String(Math.min(dayOfMonth, 28)).padStart(2, '0');
      const targetNavDate = `${day}-${month}-${year}`;
      const navItem = getNearest(targetNavDate, navData);
      const navVal = navItem ? parseFloat(navItem.nav) : 10;
      if (navVal > 0) {
        totalUnits += monthlySip / navVal;
        installments++;
      }
      cur.setMonth(cur.getMonth() + 1);
    }
    const totalInvested = Math.max(monthlySip, installments * monthlySip);
    const maturity = totalUnits * eNav;
    const gain = maturity - totalInvested;
    const absReturn = (gain / totalInvested) * 100;
    // Approximated Annualized Return for SIP
    const avgDurationYears = Math.max(0.1, holdingYears / 2);
    const cagr =
      totalInvested > 0 && maturity > 0
        ? (Math.pow(maturity / totalInvested, 1 / avgDurationYears) - 1) * 100
        : 0;
    const lowerT = Math.min(parseDateParts(currentNavStartDate), parseDateParts(currentNavEndDate));
    const upperT = Math.max(parseDateParts(currentNavStartDate), parseDateParts(currentNavEndDate));
    const points = navData
      .map((p) => ({
        date: p.date,
        nav: Number((totalUnits * parseFloat(p.nav)).toFixed(2)),
        time: parseDateParts(p.date),
      }))
      .filter((p) => p.time >= lowerT && p.time <= upperT)
      .sort((a, b) => a.time - b.time)
      .map(({ date, nav }) => ({ date, nav }));
    return {
      invested: totalInvested,
      maturity,
      gain,
      absReturn,
      cagr,
      startNavVal: sNav,
      endNavVal: eNav,
      datasets: [
        {
          label: `${fund?.schemeName || 'Fund'} (SIP)`,
          color: fund?.color || '#2563eb',
          data: points,
        },
      ],
    };
  }, [
    fund,
    navData,
    currentNavStartDate,
    currentNavEndDate,
    startDateISO,
    endDateISO,
    investmentType,
    investmentValue,
    holdingYears,
    minNavDateISO,
    maxNavDateISO,
  ]);
  // Compute live tax calculations based on Indian Finance Act 2024 / Sec 112A
  const taxCalculations = useMemo(() => {
    const gains = Math.max(0, performance.gain);
    let effectiveTax = 0;
    let rateLabel = '';
    let categoryBadge = '';
    let effectiveMode = taxMode;
    if (taxMode === 'auto') {
      if (fundCategory === 'debt') {
        effectiveMode = 'slab30';
      } else if (fundCategory === 'hybrid_conservative') {
        effectiveMode = holdingDays > 1095 ? 'ltcg' : 'slab30';
      } else {
        effectiveMode = isLongTerm ? 'ltcg' : 'stcg';
      }
    }
    if (effectiveMode === 'none') {
      effectiveTax = 0;
      rateLabel = '0% (Tax-Exempt)';
      categoryBadge = 'Exempt';
    } else if (effectiveMode === 'ltcg') {
      // Equity LTCG (Budget 2024): ₹1.25L annual exemption, 12.5% + 4% cess = 13.0%
      const taxableGains = Math.max(0, gains - 125000);
      effectiveTax = taxableGains * 0.13;
      rateLabel = '12.5% LTCG (>₹1.25L Exemption + 4% Cess)';
      categoryBadge = 'Equity LTCG (12.5%)';
    } else if (effectiveMode === 'stcg') {
      // Equity STCG (Budget 2024): 20% + 4% cess = 20.8%
      effectiveTax = gains * 0.208;
      rateLabel = '20% STCG (+ 4% Cess)';
      categoryBadge = 'Equity STCG (20%)';
    } else if (effectiveMode === 'slab30') {
      // Debt / Slab 30% (+ 4% cess = 31.2%)
      effectiveTax = gains * 0.312;
      rateLabel = '30% Slab (+ 4% Cess)';
      categoryBadge = 'Income Tax Slab (30%)';
    } else if (effectiveMode === 'slab20') {
      effectiveTax = gains * 0.208;
      rateLabel = '20% Slab (+ 4% Cess)';
      categoryBadge = 'Income Tax Slab (20%)';
    }
    const postTaxMaturity = performance.maturity - effectiveTax;
    const postTaxProfit = performance.gain - effectiveTax;
    const postTaxCagr =
      performance.invested > 0 && postTaxMaturity > 0
        ? (Math.pow(postTaxMaturity / performance.invested, 1 / holdingYears) - 1) * 100
        : 0;
    return {
      taxAmount: effectiveTax,
      postTaxMaturity,
      postTaxProfit,
      postTaxCagr,
      rateLabel,
      categoryBadge,
    };
  }, [performance, taxMode, fundCategory, isLongTerm, holdingDays, holdingYears]);
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
          {/* Interactive Date & Investment Controls Toolbar */}
          <div className={styles.controlBar}>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Presets:</span>
              <div className={styles.presetGroup}>
                {['1M', '6M', '1Y', '3Y', '5Y', 'All'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.presetBtn} ${activePreset === p ? styles.activePreset : ''}`}
                    onClick={() => handleSelectPreset(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Date Range:</span>
              <input
                type="date"
                className={styles.dateInput}
                value={startDateISO}
                min={minNavDateISO}
                max={endDateISO || maxNavDateISO}
                onChange={(e) => setStartDateISO(e.target.value)}
                aria-label="Modal Start Date"
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
              <input
                type="date"
                className={styles.dateInput}
                value={endDateISO}
                min={startDateISO || minNavDateISO}
                max={maxNavDateISO}
                onChange={(e) => setEndDateISO(e.target.value)}
                aria-label="Modal End Date"
              />
            </div>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Type:</span>
              <div className={styles.typeToggleGroup}>
                <button
                  type="button"
                  className={`${styles.typeToggleBtn} ${investmentType === 'lumpsum' ? styles.activeType : ''}`}
                  onClick={() => {
                    setInvestmentType('lumpsum');
                    setInvestmentValue('100000');
                  }}
                >
                  Lumpsum
                </button>
                <button
                  type="button"
                  className={`${styles.typeToggleBtn} ${investmentType === 'sip' ? styles.activeType : ''}`}
                  onClick={() => {
                    setInvestmentType('sip');
                    setInvestmentValue('5000');
                  }}
                >
                  Monthly SIP
                </button>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>₹</span>
                <input
                  type="number"
                  className={styles.inputField}
                  value={investmentValue}
                  step={investmentType === 'sip' ? '500' : '5000'}
                  min="100"
                  onChange={(e) => setInvestmentValue(e.target.value)}
                  placeholder={investmentType === 'sip' ? 'SIP Amt' : 'Lumpsum Amt'}
                  aria-label="Investment Amount"
                />
              </div>
            </div>
          </div>
          {/* Key Return Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                {investmentType === 'sip' ? 'Total Invested (SIP)' : 'Invested Capital'}
              </span>
              <span className={styles.statValue}>{formatINR(performance.invested)}</span>
              <span className={styles.statSubtext}>
                Start NAV: ₹{performance.startNavVal.toFixed(2)}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Pre-Tax Maturity</span>
              <span className={styles.statValue}>{formatINR(performance.maturity)}</span>
              <span className={styles.statSubtext}>
                End NAV: ₹{performance.endNavVal.toFixed(2)}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Gross Capital Gain</span>
              <span
                className={`${styles.statValue} ${performance.gain >= 0 ? styles.statGain : styles.statLoss}`}
              >
                {performance.gain >= 0 ? '+' : ''}{formatINR(performance.gain)}
              </span>
              <span className={styles.statSubtext}>{performance.absReturn.toFixed(1)}% Absolute</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Annualized Return</span>
              <span
                className={`${styles.statValue} ${performance.cagr >= 0 ? styles.statGain : styles.statLoss}`}
              >
                {performance.cagr.toFixed(2)}%
              </span>
              <span className={styles.statSubtext}>
                {holdingDays} Days (~{holdingYears} Yrs)
              </span>
            </div>
          </div>
          {/* Dedicated Interactive Chart with Zoom Presets */}
          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>
              <span>Historical NAV & Portfolio Trajectory</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                Use presets or drag horizontally to zoom
              </span>
            </div>
            <div className={styles.chartWrapper}>
              <Chart
                className={styles.chart}
                datasets={performance.datasets}
                investmentAmount={performance.invested}
                dataMode="value"
                autoHeight={true}
                enableZoom={true}
                showPresets={true}
                startDate={currentNavStartDate}
                endDate={currentNavEndDate}
                onPresetChange={handleSelectPreset}
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
                  title="Auto-detect based on fund category and holding period"
                >
                  Auto ({taxCalculations.categoryBadge})
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
                <span className={styles.taxCardLabel}>Holding & Tax Classification</span>
                <span className={styles.taxCardValue} style={{ fontSize: '1rem', color: '#0f172a' }}>
                  {holdingDays} Days ({holdingYears} Yrs)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Asset: <strong>{fundCategory.toUpperCase()}</strong> ({isLongTerm ? 'Long Term' : 'Short Term'})
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
                <span className={styles.taxCardLabel}>Post-Tax Net Return</span>
                <span className={styles.taxCardValue} style={{ color: '#15803d' }}>
                  {taxCalculations.postTaxCagr.toFixed(2)}%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#166534' }}>
                  Gross Return: {performance.cagr.toFixed(2)}%
                </span>
              </div>
            </div>
            <p className={styles.taxDisclaimer}>
              * Tax calculation follows Indian Budget 2024 provisions (Sections 112A & 111A). Long-Term Capital Gains on Equity are exempt up to ₹1,25,000 per financial year across all equity holdings, with the remainder taxed at 12.5% + 4% Health & Education Cess (effective 13.0%). Short-Term Capital Gains are taxed at 20% + 4% cess (effective 20.8%). Pure Debt funds are taxed at the investor&apos;s applicable slab rate.
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
